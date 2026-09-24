---
title: "机器学习笔记 12 · PCA 降维"
date: 2026-09-24T11:00:00+08:00
draft: false
math: true
tags: ["机器学习", "无监督学习", "降维", "PCA", "线性代数"]
categories: ["机器学习"]
series: "ml"
seriesOrder: 14
description: "维度灾难为什么可怕，特征选择与特征提取的区别，PCA 如何用协方差矩阵的特征分解找到方差最大的方向。5 个人的身高 / 坐高 / 体重手算一遍，再用 sklearn 把鸢尾花降到二维。"
summary: "PCA 在数学空间里找「最能看清全貌」的角度。去中心化 → 协方差矩阵 → 特征分解 → 按特征值排序 → 投影。"
---

## 本节内容

1. 维度灾难
2. 降维方法对比
3. PCA 直观理解与例子
4. PCA 数学原理
5. 代码演示
6. PCA 与随机森林特征选择对比
7. 总结

## 维度灾难

当特征维度不断增长时，会出现一系列问题，统称 **维度灾难**（Curse of Dimensionality）：

1. **计算成本急剧增长**：特征越多，模型训练和预测的参数量越大，算力和时间开销严重
2. **数据稀疏与过拟合风险**：高维空间中数据点变得极其稀疏。要学到有效模式，所需数据量呈指数级增长；数据不足时，模型极易记住噪声
3. **距离度量失效**：高维空间中任意两点的距离趋于相等，基于距离的算法（KNN、K-Means）几乎失效
4. **多重共线性**：许多特征之间强相关（「房屋面积」与「房间数量」），既不提供额外信息，还会干扰线性模型对特征权重的评估

## 传统的降维方法

减少特征数量的预处理叫 **降维**：

1. **特征选择 Feature Selection**：直接从原始特征中挑选最有价值的子集，剔除无用或冗余特征
   - 常见方法：过滤法（方差阈值、相关系数）、包装法（递归特征消除）、嵌入法（L1 正则化、树模型重要性）
   - 缺点：非此即彼，直接丢弃某些特征可能永久损失部分有用信息
2. **特征提取 Feature Extraction**：将高维原始特征映射到一个低维新空间，新特征是原始特征的组合
   - 优点：在降低维度的同时最大程度保留原始信息
   - 代表算法：PCA 主成分分析

## 主成分分析 PCA

**主成分分析**（Principal Component Analysis, PCA）是一种无监督的线性降维算法：将高维数据投影到低维空间，同时尽量保留数据中的 **最大方差（即信息量）**。

PCA 就是在数学空间里寻找最佳观察角度的算法，用最少的角度最大程度展示全貌。这些角度就是所谓的 **主成分**。

<!-- 图：materials/img1201teapot.png -->

### 身高体重示例

假设构建健康风险预测模型，数据集中有身高和体重两个特征。画到二维坐标系上，横轴身高，纵轴体重：

<!-- 图：materials/img1202HWrelationship.png -->

- 身高越高，体重往往越重
- 数据点大致沿左下到右上的对角线排布

身高与体重存在强烈的 **正相关**，携带重叠的信息。

<!-- 图：materials/img1203HWproject.png -->

PCA 会找到最能反映数据走势的那条对角线，然后把所有数据点投影到这条线上：

- 投影之后，每人只需一个数值表示，从二维降到一维
- 这个新特征近似于 **体型指数**（类似 BMI 的含义）

**PCA 能在缺乏医学知识的情况下，纯粹通过数据的数学结构自动发现这个组合特征。**

> **提示**
> PCA 不是简单扔掉某个特征，而是把多个相关特征融合成一个新的综合特征。新特征保留了原来特征的大部分信息，同时消除了它们之间的冗余。

### 房屋地段示例

假设构建二手房价格预测模型，数据集中有 6 个特征：

| 特征 | 说明 |
|---|---|
| 地铁距离 | 距离最近地铁站的距离 |
| 公交线路数 | 周边 1 km 内的公交线路数量 |
| 商场数量 | 周边 2 km 内的商场数量 |
| 学校评分 | 周边学区学校的综合评分 |
| 医院等级 | 周边最近医院的等级（1–3 级） |
| 公园面积 | 周边绿地公园的总面积 |

#### 问题梳理

直接使用 6 维特征的问题：

- **多重共线性**：地铁距离和公交线路数高度相关，模型很难判断到底是哪个在起作用
- **特征冗余**：6 个特征中大量信息重复，徒增模型复杂度
- **难以解释**：模型说地铁距离的权重是 −0.23，业务人员很难理解

背后的隐藏概念是 **地段**。这 6 个特征表面各不相同，但都与「地段好坏」密切相关，内部存在大量正相关，携带高度重叠的信息。

#### 压缩结果

PCA 自动分析相关性，把 6 个特征压缩成少量综合成分（以下系数为示意）：

1. **第一主成分 PC1 ≈ 地段综合分**

   {{< math >}}
   \text{PC1} = 0.45 \times (-\text{地铁距离}) + 0.42 \times \text{公交数量} + 0.40 \times \text{商场数量} + 0.38 \times \text{学校} + 0.36 \times \text{医院等级} + 0.35 \times \text{公园面积}
   {{< /math >}}

   给每个特征一个权重，可能解释原始数据约 70% 的方差

2. **第二主成分 PC2 ≈ 生活便利 vs 自然环境**

   {{< math >}}
   \text{PC2} = 0.52 \times \text{公园面积} + 0.48 \times \text{公交数量} - 0.43 \times \text{商场} - 0.40 \times \text{地铁距离}
   {{< /math >}}

   捕捉另一维度的差异（郊区宜居型 vs 市区商业型），可能额外解释约 15% 的方差

两项主成分合计解释约 85% 的信息。6 维压缩成 2 维，大幅降低复杂度，业务人员也更容易理解这两个综合指标。

> **提示**
> PCA 用数学方法把隐藏因子挖出来，用少数维度替代大量冗余特征。

## PCA 的数学原理

- **方差**（Variance）：每个样本减均值，平方后再平均。**数据越分散，方差越大**
- **协方差**（Covariance）：两个变量各自减去均值后相乘再平均。**正负反映两个变量是否同步变化**

PCA 的底层逻辑建立在协方差矩阵和特征值分解之上。假设数据矩阵 \(X\) 有 \(n\) 个样本、\(d\) 个特征（\(n \times d\)），要降到 \(k\) 维。

<!-- 图：materials/img1204PCAstep.png -->

### 数据去中心化

每个特征减去该特征的均值，处理后均值为零：

{{< math >}}
x_i^{(j)} \leftarrow x_i^{(j)} - \mu_j
{{< /math >}}

- \(\mu_j\)：第 \(j\) 个特征的均值

> **注意**
> 去中心化只是把坐标原点移到数据中心，**不会消除量纲的影响**。如果特征量级差异大（身高 cm 与体重 kg、或收入元与年龄岁），方差大的特征会主导主成分。实践中通常先做 **标准化**（`StandardScaler`，即去中心化再除以标准差），此时协方差矩阵就是相关系数矩阵。下面手算的例子为了数字直观，只做去中心化。

假设测量 5 个人的身高、坐高、体重：

| 人 | 身高 (cm) | 坐高 (cm) | 体重 (kg) |
|---|---|---|---|
| A | 160 | 90 | 55 |
| B | 170 | 95 | 65 |
| C | 180 | 100 | 80 |
| D | 150 | 85 | 45 |
| E | 175 | 98 | 72 |

均值分别为 167、93.6、63.4。去中心化后的数据矩阵 \(X\)：

{{< math >}}
X =
\begin{bmatrix}
-7 & -3.6 & -8.4 \\
3 & 1.4 & 1.6 \\
13 & 6.4 & 16.6 \\
-17 & -8.6 & -18.4 \\
8 & 4.4 & 8.6
\end{bmatrix}
{{< /math >}}

### 计算协方差矩阵

协方差衡量两个变量之间的相关性。去中心化后数据矩阵 \(X\) 的协方差矩阵：

{{< math >}}
C = \frac{1}{n-1} X^{T} X
{{< /math >}}

- \(\frac{1}{n-1}\)：贝塞尔修正（Bessel's correction）

> **提示**
> 用样本推断总体时，协方差矩阵的无偏估计需要贝塞尔修正。简单的 \(\frac{1}{n}\) 会低估方差：\(\frac{1}{n}\) 是有偏估计，\(\frac{1}{n-1}\) 是无偏估计。对 PCA 而言，用哪个只影响特征值的整体缩放，不影响特征向量（主成分方向）和解释方差比例。

得到的 \(C\) 是 \(d \times d\) 的对称矩阵：

{{< math >}}
C =
\begin{bmatrix}
145 & 73.5 & 165.25 \\
73.5 & 37.3 & 83.7 \\
165.25 & 83.7 & 190.3
\end{bmatrix}
{{< /math >}}

- 对角线元素是各特征的方差：身高 145、坐高 37.3、体重 190.3
- 非对角线元素是特征之间的协方差：身高–体重 165.25、身高–坐高 73.5、坐高–体重 83.7

### 计算特征值与特征向量

对协方差矩阵 \(C\) 进行特征分解，求所有特征值 \(\lambda\) 和对应的特征向量 \(v\)：

{{< math >}}
C v = \lambda v
{{< /math >}}

- \(v\)：特征向量，是新的坐标轴方向，即 **主成分**
- \(\lambda\)：特征值，代表数据投影到该方向上的方差大小，即 **主成分的重要性**

解特征方程得到 3 个特征值：

{{< math >}}
\lambda_1 \approx 334.93, \quad \lambda_2 \approx 37.67, \quad \lambda_3 \approx 0
{{< /math >}}

对应的单位特征向量：

{{< math >}}
v_1 \approx
\begin{bmatrix} 0.592 \\ 0.315 \\ 0.741 \end{bmatrix},
\quad
v_2 \approx
\begin{bmatrix} -0.793 \\ 0.522 \\ 0.314 \end{bmatrix},
\quad
v_3 \approx
\begin{bmatrix} 0.147 \\ 0.793 \\ -0.592 \end{bmatrix}
{{< /math >}}

- \(v_1\) 分量均为正，且身高和体重系数较大：综合反映身高、坐高、体重共同增减的「体型大小」维度
- \(v_2\) 身高系数为负，坐高、体重系数为正：捕捉「胖瘦比例」（身高相同时偏胖或偏瘦）
- \(\lambda_3 \approx 0\) 说明第三个方向几乎没有方差，数据实际几乎完全落在一个二维平面上

> **补充**
> 为什么「方差最大的方向」就是协方差矩阵的特征向量？把数据投影到单位向量 \(w\) 上，投影的方差是 \(w^T C w\)。在 \(\|w\| = 1\) 的约束下最大化它，拉格朗日条件正好是 \(Cw = \lambda w\)，且最大方差就是最大特征值。实际库（如 sklearn）不显式构造 \(C\)，而是对 \(X\) 做 SVD，数值上更稳定，结果等价。

### 选取主成分并构建投影矩阵

把特征值 **从大到小** 排序：\(\lambda_1 \ge \lambda_2 \ge \cdots \ge \lambda_d\)。取前 \(k\) 个最大特征值对应的特征向量，按列拼接成 \(d \times k\) 的投影矩阵 \(W\)。

\(k\) 的选定通常看 **累计解释方差率**：前 \(k\) 个特征值之和除以特征值总和，找能超过阈值（如 95%）的最小 \(k\)：

{{< math >}}
\text{解释方差率}_i = \frac{\lambda_i}{\sum_{j=1}^{d} \lambda_j}
{{< /math >}}

{{< math >}}
k^{*} = \min \left\{ k : \frac{\sum_{i=1}^{k} \lambda_i}{\sum_{j=1}^{d} \lambda_j} \ge \text{threshold} \right\}
{{< /math >}}

上述示例中：

- 总方差 \(\sum_j \lambda_j = 334.93 + 37.67 + 0 = 372.6\)
- PC1 解释率 \(334.93 / 372.6 \approx 89.9\%\)
- PC2 解释率 \(37.67 / 372.6 \approx 10.1\%\)
- PC3 解释率 \(0 / 372.6 = 0\)

PC1 与 PC2 累计解释率达到 100%，选 \(k = 2\)，投影矩阵：

{{< math >}}
W = [\, v_1 \quad v_2 \,] =
\begin{bmatrix}
0.592 & -0.793 \\
0.315 & 0.522 \\
0.741 & 0.314
\end{bmatrix}
{{< /math >}}

### 数据投影

去中心化后的 \(X\) 乘以投影矩阵 \(W\)，得到降维后的新数据矩阵 \(Y\)（\(n \times k\)）：

{{< math >}}
Y = X W
{{< /math >}}

{{< math >}}
\begin{bmatrix}
-7 & -3.6 & -8.4 \\
3 & 1.4 & 1.6 \\
13 & 6.4 & 16.6 \\
-17 & -8.6 & -18.4 \\
8 & 4.4 & 8.6
\end{bmatrix}
\begin{bmatrix}
0.592 & -0.793 \\
0.315 & 0.522 \\
0.741 & 0.314
\end{bmatrix}
=
\begin{bmatrix}
-11.50 & 1.03 \\
3.83 & -1.62 \\
17.60 & -2.77 \\
-22.61 & 2.69 \\
12.68 & 0.68
\end{bmatrix}
{{< /math >}}

- 原始 \(5 \times 3\) 矩阵经过 PCA 降维后，用 2 个新特征即可（几乎无损地）表达原始信息
- PC1 体型大小：从左到右大致是从瘦小到魁梧（D → A → B → E → C）
- PC2 胖瘦比例：在同一体型水平上区分相对胖瘦
- 3 个高度相关的物理量被压缩为 2 个互不相关的主成分，消除冗余，便于二维可视化

## 鸢尾花 PCA 应用

鸢尾花数据集 150 个样本、4 个特征：花萼长度、花萼宽度、花瓣长度、花瓣宽度。

### 加载数据

```python
from sklearn.datasets import load_iris

iris = load_iris()
X, y = iris.data, iris.target
target_names = iris.target_names
feature_names = iris.feature_names

print(f"原始数据维度: {X.shape}")   # (150, 4)
```

### 标准化

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
```

### 分析特征相关性

```python
import numpy as np

corr_matrix = np.corrcoef(X_scaled, rowvar=False)
print("\n特征相关系数矩阵:")
print(np.round(corr_matrix, 3))
```

```text
[[ 1.    -0.118  0.872  0.818]
 [-0.118  1.    -0.428 -0.366]
 [ 0.872 -0.428  1.     0.963]
 [ 0.818 -0.366  0.963  1.   ]]
```

花瓣长度与花瓣宽度相关系数 0.963，与花萼长度也在 0.8 以上，说明特征间有大量冗余，是 PCA 的理想场景。

### PCA 降维

```python
from sklearn.decomposition import PCA

pca = PCA()
pca.fit(X_scaled)

print("\n各主成分特征值（方差）:", np.round(pca.explained_variance_, 4))
print("各主成分方差解释比:    ", np.round(pca.explained_variance_ratio_, 4))
print("累积方差解释比:        ", np.round(np.cumsum(pca.explained_variance_ratio_), 4))

# 主成分载荷（特征向量），理解每个主成分的含义
print("\n主成分载荷矩阵（每列是一个主成分方向）:")
loadings = pca.components_.T
for i, fname in enumerate(feature_names):
    print(f"  {fname:30s}: PC1={loadings[i,0]:+.3f}  PC2={loadings[i,1]:+.3f}")

# 降到 2 维
pca_2d = PCA(n_components=2)
X_2d = pca_2d.fit_transform(X_scaled)
```

- 各主成分特征值（方差）：`[2.9381 0.9202 0.1477 0.0209]`
- 各主成分方差解释比：`[0.7296 0.2285 0.0367 0.0052]`
- 累积方差解释比：`[0.7296 0.9581 0.9948 1.    ]`
- 主成分载荷矩阵：

  ```text
  sepal length (cm)  : PC1=+0.521  PC2=+0.377
  sepal width (cm)   : PC1=-0.269  PC2=+0.923
  petal length (cm)  : PC1=+0.580  PC2=+0.024
  petal width (cm)   : PC1=+0.565  PC2=+0.067
  ```

解读：

- **PC1 解释 72.96% 方差**：花瓣长度 (+0.58)、花瓣宽度 (+0.57)、花萼长度 (+0.52) 都有较大正载荷。PC1 代表花的整体大小，数值越大花越大
- **PC2 解释 22.85% 方差**：几乎只由花萼宽度主导 (+0.923)，其他特征贡献很小。PC2 基本就是「花萼宽度」
- **仅用 2 个主成分就捕获了 95.8% 的信息**，且从可视化中能清晰看到三个类别的分布

### 可视化

```python
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS']
plt.rcParams['axes.unicode_minus'] = False

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# --- 左图：碎石图 ---
components = range(1, 5)
axes[0].bar(components, pca.explained_variance_ratio_,
            color='#3498db', alpha=0.8, label='Individual')
axes[0].plot(components, np.cumsum(pca.explained_variance_ratio_),
             'o-', color='#e74c3c', linewidth=2, markersize=8, label='Cumulative')
axes[0].axhline(y=0.95, color='gray', linestyle='--', alpha=0.7)
axes[0].set_xlabel('Principal Component', fontsize=12)
axes[0].set_ylabel('Explained Variance Ratio', fontsize=12)
axes[0].set_title('Scree Plot - Iris Dataset', fontsize=13)
axes[0].set_xticks(components)
axes[0].legend()
axes[0].grid(True, alpha=0.3)

for i, v in enumerate(pca.explained_variance_ratio_):
    axes[0].text(i + 1, v + 0.01, f'{v:.2%}', ha='center', fontsize=10)

# --- 右图：2D 投影散点图 ---
colors = ['#e74c3c', '#3498db', '#2ecc71']
markers = ['o', 's', '^']
for i, (color, marker, name) in enumerate(zip(colors, markers, target_names)):
    mask = y == i
    axes[1].scatter(X_2d[mask, 0], X_2d[mask, 1],
                    c=color, marker=marker, label=name,
                    alpha=0.8, edgecolors='w', s=70, linewidths=0.5)

axes[1].set_xlabel(
    f'PC1 — 花的整体大小 ({pca_2d.explained_variance_ratio_[0]:.1%} variance)',
    fontsize=11)
axes[1].set_ylabel(
    f'PC2 — 花萼宽度 ({pca_2d.explained_variance_ratio_[1]:.1%} variance)',
    fontsize=11)
axes[1].set_title('PCA 2D Projection - Iris Dataset', fontsize=13)
axes[1].legend(fontsize=10)
axes[1].grid(True, alpha=0.3)

plt.tight_layout()
plt.show()
```

<!-- 图：materials/img1205Scree&Projection.png -->

## 随机森林特征选择 vs PCA

| 维度 | 随机森林特征选择 | PCA |
|---|---|---|
| 是否监督 | 需要标签 | 无监督 |
| 是否线性 | 可捕捉非线性 | 纯线性 |
| 解释性 | 高（保留原始特征） | 低（新主成分是线性组合） |
| 适用场景 | 业务诉求强、需要可解释 | 纯性能、特征高度相关 |
| 典型案例 | 用户画像、风控规则 | 图像 embedding 压缩、高维稠密特征预处理 |

> **提示**
> 先用随机森林筛掉明显无关的特征，再用 PCA 做二次降维，效果往往 1 + 1 > 2。

> **注意**
> PCA 是无监督的，它只看方差、不看标签。方差小的方向不一定没有区分能力：如果两个类别恰好只在某个低方差方向上不同，PCA 会把它扔掉。作为有监督模型的预处理时，要用交叉验证确认降维没有伤害精度。

## PCA 优劣

优点：

1. 无需人工干预，纯数据驱动
2. 有效消除特征之间的共线性，新主成分两两不相关
3. 丢弃小方差方向能压掉一部分噪音，缓解过拟合
4. 常用于高维数据的探索性可视化

缺点：

1. **线性假设**：PCA 只找线性方向。对非线性结构（流形），需要 Kernel PCA 或 t-SNE、UMAP 等非线性降维
2. **可解释性下降**：新特征是原始特征的线性组合，失去原本的业务含义。可以借助载荷矩阵解读（鸢尾花的 PC1 就是「整体大小」），但不再是一个直接的业务字段
3. **对异常值敏感**：异常值会显著拉高方差、扭曲主成分方向
4. **对量纲敏感**：不做标准化时，大量级特征会主导结果
