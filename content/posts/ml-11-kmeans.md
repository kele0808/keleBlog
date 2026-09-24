---
title: "机器学习笔记 11 · K-Means 聚类"
date: 2026-09-24T10:50:00+08:00
draft: false
math: true
tags: ["机器学习", "无监督学习", "聚类", "K-Means"]
categories: ["机器学习"]
series: "ml"
seriesOrder: 13
description: "无监督学习让数据物以类聚。K-Means 在「分配样本」和「更新质心」之间循环直到收敛；用 numpy 逐轮复现迭代，再用 K-Means++ 和肘部法则优化，最后做一次图像颜色压缩。"
summary: "选中心 → 分簇 → 更新中心 → 再分簇 → 直到稳定。SSE 越小簇越紧凑；K 要自己选，初始点要选得散。"
---

无监督学习让数据物以类聚。

## 本节内容

1. 无监督聚类问题
2. K-Means 核心思想
3. 质心与簇内相似度
4. K-Means 迭代流程
5. 完整流程演示
6. K-Means 优化
7. 聚类的常见应用
8. 总结

## 无监督聚类问题

没有标签的数据内含结构或规律，需要通过算法揭示。

**聚类问题**：在没有标签的前提下，根据样本之间的相似性，将数据自动划分为若干组，使得 **同组内样本尽可能相似，不同组之间尽可能有差异**。

1. **用户画像与分群**：根据购买频次、消费金额等，将用户划分为高价值、潜力或流失风险用户
2. **图像压缩**：从像素中找出典型色彩，减少存储空间
3. **异常检测**：识别偏离常规的数据点（异常访问、恶意攻击），只依赖数据分布特征

## K-Means 核心思想

K-Means 是经典聚类算法，将一批无标签数据自动划分为 K 个簇：

- **K**：预先指定的簇数
- **Means**：均值，每个簇的中心由该簇内所有样本的均值表示

目标是找到 K 个有代表性的中心点，使每个样本归属于离自己最近的中心，并尽量减小样本到中心的距离。

## 质心与簇内相似度

### 质心 Centroid

一个簇的中心位置，取该簇所有点在各个维度上的 **均值**。假设三点 \(A(x_a, y_a)\)、\(B(x_b, y_b)\)、\(C(x_c, y_c)\)，质心为：

{{< math >}}
\left( \frac{x_a + x_b + x_c}{3},\ \frac{y_a + y_b + y_c}{3} \right)
{{< /math >}}

### 距离度量

最常用的是 **欧氏距离**（直线距离）。二维平面中 A、B 两点：

{{< math >}}
d(A, B) = \sqrt{(A_x - B_x)^2 + (A_y - B_y)^2}
{{< /math >}}

推广到 \(n\) 维空间：

{{< math >}}
d(A, B) = \sqrt{\sum_{i=1}^{n} (A_i - B_i)^2}
{{< /math >}}

思路不变：每个维度分别求差、平方、求和，最后开平方。

### 簇内相似度

K-Means 的目标：同一簇的样本尽量彼此接近，并尽量靠近该簇质心。度量用 **簇内平方和**（Sum of Squared Errors, SSE，sklearn 里叫 `inertia_`）：

{{< math >}}
SSE = \sum_{i=1}^{K} \sum_{x \in C_i} \left\| x - \mu_i \right\|^2
{{< /math >}}

- \(C_i\)：第 \(i\) 个簇
- \(\mu_i\)：第 \(i\) 个簇的质心
- \(\| x - \mu_i \|^2\)：样本点到质心的距离平方

**SSE 越小，簇内样本越紧凑，聚类效果越好。** K-Means 的本质就是通过不断调整样本划分和质心位置，使 SSE 持续减小，直到结果稳定。

> **补充**
> 为什么「更新质心取均值」是对的？固定每个簇的成员不变时，\(\sum_{x \in C_i} \| x - \mu \|^2\) 对 \(\mu\) 求导为零的解恰好是簇内均值。所以「分配」和「更新」两步各自都不会让 SSE 变大，算法一定收敛，只是不保证收敛到全局最优。

## K-Means 迭代流程

选中心 → 分簇 → 更新中心 → 再分簇 → 直到稳定

1. **初始化质心**：预先指定簇数 K，从数据集中随机选取 K 个初始中心
2. **分配样本**：对每个样本，计算它到各个质心的距离，划分到最近的质心所在的簇
3. **更新质心**：根据当前簇中的所有样本重新计算中心点，即各维度的均值
4. **重复迭代**：质心变化后，原有划分可能不再最优；重新分配、再更新质心，如此反复
5. **收敛停止**：满足任一条件时停止
   - 质心位置几乎不再变化
   - 样本的簇归属不再变化
   - SSE 的下降幅度已经非常小
   - 达到预设的最大迭代次数

K-Means 的核心就是在 **样本分配** 和 **质心更新** 之间循环，通过迭代逐步减小簇内误差。

## 代码实现

### 生成数据

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_blobs

plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS']   # 中文显示
plt.rcParams['axes.unicode_minus'] = False                         # 负号显示

np.random.seed(42)
# 生成数据
X, y_true = make_blobs(
    n_samples=300,       # 样本数量
    centers=4,           # 中心数量
    cluster_std=0.6,     # 簇离散度
    random_state=0,
)

plt.figure(figsize=(8, 6))
plt.scatter(X[:, 0], X[:, 1], s=30, c='gray')
plt.title("初始化数据")
plt.show()
```

<!-- 图：materials/img1101InitialData.png -->

### 初始化中心

```python
# 随机选择 k 个初始中心
k = 4
initial_indices = np.random.choice(X.shape[0], k, replace=False)
centroids = X[initial_indices]

plt.figure(figsize=(8, 6))
plt.scatter(X[:, 0], X[:, 1], s=30, c='gray')
plt.scatter(centroids[:, 0], centroids[:, 1], s=200, c='red', marker='x')
plt.title("初始化中心: 随机选择 k 个点")
plt.show()
```

<!-- 图：materials/img1102InitialCentroids.png -->

### 逐轮迭代

```python
from scipy.spatial.distance import cdist

# 设置组图画幅
fig, axes = plt.subplots(6, 2, figsize=(16, 36))

# 设置迭代上限
max_iters = 6
for i in range(max_iters):
    # --- Step 1 分配样本 ---
    distances = cdist(X, centroids)          # 各样本点到各中心的距离 (300, k)
    labels = np.argmin(distances, axis=1)    # 按最近中心分配标签
    ax = axes[i][0]
    ax.scatter(X[:, 0], X[:, 1], s=30, c=labels, cmap='viridis', alpha=0.6)
    ax.scatter(centroids[:, 0], centroids[:, 1], s=200, c='red', marker='x')
    ax.set_title(f"迭代 {i + 1} : Step 1 - 分配点到最近中心")

    # --- Step 2 更新中心 ---
    new_centroids = np.array([X[labels == j].mean(axis=0) for j in range(k)])   # 各簇均值
    ax = axes[i][1]
    ax.scatter(X[:, 0], X[:, 1], s=30, c=labels, cmap='viridis', alpha=0.6)
    ax.scatter(new_centroids[:, 0], new_centroids[:, 1], s=200, c='red', marker='x')
    ax.set_title(f"迭代 {i + 1} : Step 2 - 更新中心到簇均值")

    # --- Step 3 检查收敛 ---
    if np.allclose(centroids, new_centroids):
        print(f"算法在 {i + 1} 次迭代后收敛! 中心不再移动。")
        break
    centroids = new_centroids

plt.suptitle("K-Means 逐轮迭代", fontsize=12, fontweight='bold')
plt.tight_layout()
plt.show()
```

<!-- 图：materials/img1103Iteration.png -->

复现过程与 [原作笔记演示](https://www.yuque.com/qx2io/machine-learning/gt0x5gv29g7t4alv#PUZHp) 不同，这里 5 次迭代即收敛（取决于随机到的初始点）。

> **注意**
> 手写实现有一个边界情况：如果某个簇一轮里一个样本都没分到，`X[labels == j].mean()` 会得到 NaN。sklearn 的实现会为空簇重新挑一个离质心最远的点。

## 优化

### 初始质心选择：K-Means++

随机选初始质心可能让算法陷入较差的局部最优。比如多个初始质心恰好挨在一起，可能很多轮迭代后仍未收敛，或者把一个真实簇切成两半、把两个真实簇合成一个。不同的初始化方式，最终结果可能差异明显。

**K-Means++**：

1. 随机选一个样本点作为第一个质心
2. 选下一个质心时，按「到已有质心距离的平方」为权重抽样，离得越远越容易被选中
3. 重复直到选出 K 个初始质心

sklearn 的 `KMeans` 默认就是 `init='k-means++'`。

### 肘部法则选择 K 值

K-Means 的一大问题是簇数 K 要预先指定。**肘部法则**（Elbow Method）：

- 依次尝试不同 K 值，计算对应的 SSE
- 随着 K 增大，SSE 会持续下降（K = 样本数时 SSE = 0）
- 当 K 超过某个值后，SSE 下降幅度明显减小，曲线趋于平缓

**斜率显著减小、曲线趋于平缓的拐点** 称为肘部，是 K 值的较优选择。

<!-- 图：materials/img1104ElbowMethod.png -->

> **补充**
> 肘部经常不明显。一个更量化的补充指标是 **轮廓系数**（Silhouette Score，`sklearn.metrics.silhouette_score`），取值 \([-1, 1]\)，衡量样本「离自己簇有多近、离最近的别的簇有多远」，越大越好；对不同 K 各算一次取最大。

### 可视化

结合 K-Means++ 和 `n_init` 多次运行：

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_blobs
from sklearn.cluster import KMeans

plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS']
plt.rcParams['axes.unicode_minus'] = False

# 1. 生成数据
X, y_true = make_blobs(
    n_samples=300,
    centers=4,
    cluster_std=0.8,
    random_state=42,
)

# 2. 肘部法则：尝试 K = 1..9
sse = []
K_range = range(1, 10)
for k in K_range:
    km = KMeans(n_clusters=k, init='k-means++', n_init=10, random_state=42).fit(X)
    sse.append(km.inertia_)

# 3. 运行 K-Means（K = 4）
kmeans = KMeans(
    n_clusters=4,
    init='k-means++',
    n_init=10,
    random_state=42,
)
y_pred = kmeans.fit_predict(X)
centroids = kmeans.cluster_centers_

# 4. 可视化
plt.figure(figsize=(15, 5))

plt.subplot(1, 3, 1)
plt.plot(K_range, sse, 'o-')
plt.title('肘部法则')
plt.xlabel('K')
plt.ylabel('SSE')
plt.grid(True, alpha=0.3)

plt.subplot(1, 3, 2)
plt.scatter(X[:, 0], X[:, 1], c='gray', s=20, alpha=0.6)
plt.title('聚类前')
plt.xlabel('特征 1')
plt.ylabel('特征 2')

plt.subplot(1, 3, 3)
plt.scatter(X[:, 0], X[:, 1], c=y_pred, s=20, cmap='viridis', alpha=0.6)
plt.scatter(centroids[:, 0], centroids[:, 1], c='red', s=200, marker='x', linewidths=1.5, label='质心')
plt.title('K-Means 聚类结果 (K=4)')
plt.xlabel('特征 1')
plt.ylabel('特征 2')
plt.legend()

plt.tight_layout()
plt.show()

print(f"SSE: {kmeans.inertia_:.2f}")
print(f"迭代次数: {kmeans.n_iter_}")
```

<!-- 图：materials/img1105KMeans++Elbow.png -->

- SSE: 362.47
- 迭代次数: 3

## 常见应用

聚类不依赖标注数据，却在业务中有广泛应用。核心作用是从无标签数据中自动发现隐藏结构，为决策提供支持。

| 应用领域 | 典型场景 | 聚类的核心作用 |
|---|---|---|
| **客户分群** | 电商用户 RFM 分层 | 自动识别用户价值层级，支撑精准运营 |
| **图像处理** | 颜色量化、图像分割 | 压缩颜色空间，划分图像语义区域 |
| **文档聚类** | 新闻 / 论文自动归类 | 海量文本按主题自动归组，辅助检索与推荐 |
| **异常检测** | 网络入侵、信用卡欺诈 | 远离所有簇中心的样本标记为潜在异常 |
| **数据预处理** | 连续特征离散化分桶 | 自适应分桶，增强特征表达能力 |
| **推荐系统** | 协同过滤的冷启动 | 新用户 / 物品归入相似簇，快速生成初始推荐 |

聚类常作为数据探索、特征工程和系统冷启动等环节的组成部分，与其他模型配合使用。

### 图片压缩

用 K-Means 把彩色图片的颜色压缩成 4 种、16 种、64 种，实现图片瘦身、简化色彩：

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from skimage import io          # pip install scikit-image

# 1. 读取图片并归一化
image = io.imread('your_image.jpg')[:, :, :3]   # 替换为你的图片路径；去掉可能的 alpha 通道
image = image / 255.0                            # 归一化到 [0, 1]
h, w, c = image.shape
pixels = image.reshape(-1, 3)                    # 展平为 (h*w, 3) 的像素矩阵

# 2. 对不同 K 值进行压缩
fig, axes = plt.subplots(1, 4, figsize=(20, 5))
axes[0].imshow(image)
axes[0].set_title(f'原图（{len(np.unique(pixels, axis=0))} 种颜色）')
axes[0].axis('off')

for idx, k in enumerate([4, 16, 64]):
    km = KMeans(n_clusters=k, n_init=10, random_state=42)
    labels = km.fit_predict(pixels)
    compressed = km.cluster_centers_[labels].reshape(h, w, c)

    axes[idx + 1].imshow(compressed)
    axes[idx + 1].set_title(f'K={k}（{k} 种颜色）')
    axes[idx + 1].axis('off')

plt.suptitle('K-Means 图像颜色压缩', fontsize=16)
plt.tight_layout()
plt.show()
```

<!-- 图：materials/img1107CompressedImg.png -->

每个像素是 RGB 三维空间中的一个点，K 个质心就是 K 种「代表色」，每个像素用离它最近的代表色替换。

## 总结优劣

优点：

- **思想简单，容易理解**：不断「分配样本」和「更新质心」
- **计算效率高**：复杂度约 \(O(nKd)\) 每轮，适合大规模数据和工程应用
- **易于实现**：最常见的聚类入门算法
- **结果可解释性强**：每个簇都有一个中心，容易理解每类的特征

劣势：

- **需要预设簇数 K**：选择不当会严重影响结果（可用肘部法则、轮廓系数改善）
- **对初始值敏感**：初始质心选择不当容易陷入局部最优（可用 K-Means++ 改善）
- **只能发现凸形 / 球形簇**：基于欧氏距离的假设，无法处理环形、月牙形等非凸形状
- **对噪声和离群点敏感**：极端值会显著拉偏质心（可用 K-Medoids 替代）
- **特征尺度敏感**：不同量纲的特征会让距离计算被大量纲特征主导，使用前需要标准化

## 实用改进

1. **使用 K-Means++ 初始化**：让初始质心尽量分散，显著降低陷入较差局部最优的概率
2. **多次运行并选择最优结果**：从不同初始质心出发，选 SSE 最小的结果（`n_init=10`）
3. **使用 Mini-Batch K-Means 提高效率**：大规模数据下每轮只用一个小批量样本更新质心，显著提速

## 其他常用聚类算法

1. **中心点聚类 K-Medoids**：与 K-Means 取均值不同，强制选取 **实际存在的数据点** 作为中心，增强对噪声和极端值的稳健性
2. **基于密度的聚类 DBSCAN**：不需要预先指定 K，通过样本的 **密度** 划分簇，能发现任意形状（环形、月牙形）的簇，并自带异常点检测
3. **层次聚类 Hierarchical Clustering**：不需要预先指定 K，通过节点间距离自底向上（或自顶向下）构建一棵 **聚类树**，适合需要多层次分类的场景
