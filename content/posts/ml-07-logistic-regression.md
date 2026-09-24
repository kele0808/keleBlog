---
title: "机器学习笔记 07 · 逻辑回归"
date: 2026-09-24T10:10:00+08:00
draft: false
math: true
tags: ["机器学习", "逻辑回归", "分类", "交叉熵", "混淆矩阵"]
categories: ["机器学习"]
series: "ml"
seriesOrder: 9
description: "逻辑回归 = 线性回归 + Sigmoid。从为什么不用 MSE、伯努利分布、最大似然推导出交叉熵；乳腺癌数据集实战；混淆矩阵、精确率 / 召回率 / F1、ROC / AUC；Softmax 与神经网络的联系。"
summary: "分类问题解决「是哪类」。Sigmoid 把线性输出压成概率，交叉熵让优化保持凸性，梯度公式和线性回归长得一模一样。"
---

## 本节内容

1. 分类问题与线性回归的局限
2. 逻辑回归的核心：Sigmoid 函数
3. 损失函数：交叉熵推导
4. 梯度计算与训练
5. 案例：乳腺癌预测
6. 模型评估与 ROC
7. 总结：与神经网络的联系

## 分类问题

线性回归预测 **连续数值**，解决「是多少」；逻辑回归预测 **离散标签**，解决「是哪类」：推断垃圾邮件、推断肿瘤良恶、推断广告是否有效。

**分类**（Classification）：预测离散标签，输出有限个互斥类别。常见 **二分类**，也可扩展到 **多分类**。

## 逻辑回归的作用

线性回归直接处理分类任务有两个缺陷：

1. **输出范围失控**：线性回归值域是 \((-\infty, +\infty)\)，分类需要 \((0, 1)\) 的概率
2. **受异常值影响**：极端样本会严重拉偏回归线，导致原本预测正确的普通样本被错分

逻辑回归的解决思路：给线性回归叠加一个「变形器」。

## Sigmoid 函数

Sigmoid 把线性回归的输出映射为 \((0, 1)\) 的概率值：

{{< math >}}
\begin{aligned}
z &= wx + b \\
\sigma(z) &= \frac{1}{1 + e^{-z}} \\
\hat{y} &= \frac{1}{1 + e^{-(wx + b)}}
\end{aligned}
{{< /math >}}

<!-- 图：materials/img0701Sigmoid.png -->

> **提示**
> **逻辑回归 = 线性回归 + Sigmoid**

### Sigmoid 的优势

1. **输出天然具有概率含义**：值域严格在 \((0, 1)\)，0.8 代表模型有 80% 的把握判为正类
2. **自带决策分界点**：\(\sigma(0) = 0.5\)。\(wx + b > 0\) → 概率大于 0.5 → 正类；\(wx + b < 0\) → 负类；\(wx + b = 0\) 是决策边界
3. **处处可导，导数极简**：阶跃函数在跳变点不可导，阻碍梯度下降；Sigmoid 连续平滑，导数是 \(\sigma'(z) = \sigma(z)(1 - \sigma(z))\)

<!-- 图：materials/img0702StepFunction.png -->

## 损失函数

### 为何不用 MSE

- **线性回归 + MSE = 凸函数**：不论初始参数在哪，梯度下降都能找到全局最优

  <!-- 图：materials/img0703LInearMSE.png -->

- **逻辑回归 + MSE = 非凸函数**：引入非线性的 Sigmoid 后，损失函数不再是单个碗形，会有 **局部最优**，还有 **梯度消失** 问题

  <!-- 图：materials/img0704LogicalMSE.png -->

  1. **局部最优**：损失曲面出现多个平缓区域，梯度下降可能卡在那里
  2. **梯度消失**：Sigmoid 输入极大或极小时，输出逼近 1 或 0，梯度里的 \(\hat{y}(1 - \hat{y})\) 接近 0。即使预测完全错误（真实 1、预测接近 0），梯度也接近 0，参数不更新，模型停止学习

### 分类损失应该长什么样

二分类模型输出一个概率 \(p\)：

- \(p \approx 1\)：非常相信是正类
- \(p \approx 0\)：非常相信是负类
- \(p \approx 0.5\)：最不确定，相当于随机猜

合理的损失函数应满足：

- 真实标签 \(y = 1\)：\(p\) 越接近 1 越好，越接近 0 惩罚越大
- 真实标签 \(y = 0\)：\(p\) 越接近 0 越好，越接近 1 惩罚越大

注意一个常见误区：\(p = 0.5\) 不是损失最大，而是模型最不确定。真正损失最大的是 **模型非常自信但预测错了**：真实 \(y = 1\) 却预测 \(p \approx 0\)，或反之。

### 基础数学

#### 对数函数

对数是指数的逆运算。机器学习常用自然对数（底 \(e \approx 2.718\)），记作 \(\ln(x)\) 或 \(\log(x)\)。

<!-- 图：materials/img0705NaturalLogarithm.png -->

1. **单调性一致**：对数单调递增，**最大化某个概率等价于最大化它的对数**，优化更简单
2. **防止数值下溢**：多个 (0,1) 之间的概率相乘会迅速趋近 0，计算机无法精确表示。取对数后 **乘法变加法**：\(\log(a \times b) = \log(a) + \log(b)\)

只看 \(x \in (0, 1)\)，把 \(x\) 看作预测概率 \(p\)，对 \(\log(p)\) 取负：

- \(p \to 1\) 时，\(-\log(p) \to 0\)
- \(p \to 0\) 时，\(-\log(p) \to +\infty\)

正好符合对损失函数的期待：越接近真实标签损失越小，自信地犯错时损失被显著放大。\(-\log(p)\) 很适合构造分类损失。

#### 伯努利分布

> **提示**
> 伯努利分布描述单次试验中某个事件发生或不发生的概率。
> - 成功：事件发生，\(Y = 1\)
> - 失败：事件 **不** 发生，\(Y = 0\)

二分类的本质是只有两种结果的随机试验。记标签 \(y \in \{0, 1\}\)，视作服从伯努利分布。设结果为 1 的概率是 \(p\)：

{{< math >}}
\begin{cases}
P(y = 1) = p \\
P(y = 0) = 1 - p
\end{cases}
{{< /math >}}

1. **统一公式**：把两式合并

   {{< math >}}
   P(Y = y) = p^{y} (1 - p)^{1 - y}
   {{< /math >}}

2. **结合逻辑回归**：\(y\) 是真实标签，\(\hat{y}\) 是模型预测的正类概率

   {{< math >}}
   p = \hat{y} = \frac{1}{1 + e^{-(wx + b)}}
   {{< /math >}}

3. **代入**：单个样本「预测对了」的概率

   {{< math >}}
   P(y \mid x) = \hat{y}^{\,y} (1 - \hat{y})^{1 - y}
   {{< /math >}}

#### 最大似然估计

- **概率**（Probability）：**已知模型参数**，预测 **未知数据** 出现的可能性
- **似然**（Likelihood）：**已知观测数据**，评估 **未知模型参数** 的合理性
- **最大似然估计**（Maximum Likelihood Estimation, MLE）：既然事件已经发生，那么能让它 **以最大概率发生** 的参数 \(\theta\) 就是最好的参数

**抛硬币例子**：设正面概率为 \(p\)。

1. 观测数据：抛 10 次，8 次正面，2 次反面
2. 似然函数：\(L(p) = p^8 (1 - p)^2\)
3. 最大化似然：对 \(p\) 求导

   {{< math >}}
   \begin{aligned}
   L'(p) &= 8 p^7 (1 - p)^2 - 2 p^8 (1 - p) \\
   &= 10 p^9 - 18 p^8 + 8 p^7 \\
   &= 10 p^7 \left(p - \tfrac{4}{5}\right)(p - 1)
   \end{aligned}
   {{< /math >}}

   {{< math >}}
   \begin{cases}
   L'(p) > 0, & p \in (0, \tfrac{4}{5}) \\
   L'(p) = 0, & p = 0,\ \tfrac{4}{5},\ 1 \\
   L'(p) < 0, & p \in (\tfrac{4}{5}, 1)
   \end{cases}
   {{< /math >}}

   \(L(p)\) 在 \((0, 0.8)\) 单调递增，在 \((0.8, 1)\) 单调递减，\(\max L(p) = L(0.8) = \dfrac{4^8}{5^{10}}\)

4. 结论：正面概率 \(p\) 最可能是 0.8，和直觉一致

**推广到逻辑回归**：有 \(m\) 个独立同分布的样本，它们同时按各自真实标签 \(y_i\) 发生的概率（似然函数）是所有样本预测正确概率的乘积：

{{< math >}}
L(\theta) = \prod_{i=1}^{m} \hat{y}_i^{\,y_i} (1 - \hat{y}_i)^{1 - y_i}
{{< /math >}}

两边取对数，连乘变连加，方便求导：

{{< math >}}
\log L(\theta) = \sum_{i=1}^{m} \left[ y_i \log(\hat{y}_i) + (1 - y_i) \log(1 - \hat{y}_i) \right]
{{< /math >}}

### 交叉熵损失

统计学里对似然函数 **最大化**，机器学习里对损失函数 **最小化**。对对数似然取负、再除以样本量 \(m\) 求平均，就是逻辑回归的损失函数 **交叉熵损失**（Cross-Entropy Loss）：

{{< math >}}
J(\theta) = -\frac{1}{m} \sum_{i=1}^{m} \left[ y_i \log(\hat{y}_i) + (1 - y_i) \log(1 - \hat{y}_i) \right]
{{< /math >}}

对任何一个样本，\(y\) 要么是 0 要么是 1，公式中永远只有一项在起作用，另一项被乘以 0 消掉：

| 真实标签 | 损失项 | 含义 |
|---|---|---|
| \(y = 1\) | \(-\log(\hat{y})\) | 预测概率越接近 1 损失越小，接近 0 时损失 \(\to +\infty\) |
| \(y = 0\) | \(-\log(1 - \hat{y})\) | 预测概率越接近 0 损失越小，接近 1 时损失 \(\to +\infty\) |

用交叉熵作损失时，它对参数 \(w, b\) 是 **凸函数**。无论初始权重在哪，都能收敛到全局最优；远离最优解时梯度反而大，能引导模型快速稳定地收敛。

<!-- 图：materials/img0706CrossEntropyLoss.png -->

## 梯度下降

\(\hat{y}\) 里包含 \(w, b\)，不论对哪个求导都绕不开对 \(\hat{y}\) 求导。令 \(z = wx + b\)，单样本损失 \(L = -[y \ln \hat{y} + (1 - y) \ln(1 - \hat{y})]\)，链式求导：

{{< math >}}
\begin{aligned}
\frac{\partial L}{\partial \hat{y}} &= -\frac{y}{\hat{y}} + \frac{1 - y}{1 - \hat{y}} \\[6pt]
\frac{\partial \hat{y}}{\partial z} &= \hat{y}(1 - \hat{y}) \\[6pt]
\frac{\partial L}{\partial z} &= \frac{\partial L}{\partial \hat{y}} \cdot \frac{\partial \hat{y}}{\partial z} = \hat{y} - y \\[6pt]
\frac{\partial z}{\partial w} &= x, \qquad \frac{\partial z}{\partial b} = 1
\end{aligned}
{{< /math >}}

代入 \(J = \frac{1}{m} \sum L\)：

{{< math >}}
\frac{\partial J}{\partial w_j} = \frac{1}{m} \sum_{i} (\hat{y}_i - y_i) \, x_{ij},
\qquad
\frac{\partial J}{\partial b} = \frac{1}{m} \sum_{i} (\hat{y}_i - y_i)
{{< /math >}}

| | 线性回归（MSE 取 \(\frac{1}{2m}\)） | 逻辑回归（交叉熵） |
|---|---|---|
| 权重梯度 | \(\frac{1}{m} \sum (\hat{y} - y) \cdot x_j\) | \(\frac{1}{m} \sum (\hat{y} - y) \cdot x_j\) |
| 偏置梯度 | \(\frac{1}{m} \sum (\hat{y} - y)\) | \(\frac{1}{m} \sum (\hat{y} - y)\) |
| \(\hat{y}\) 的含义 | \(wx + b\) | \(\sigma(wx + b)\) |

梯度公式形式完全一样，只是 \(\hat{y}\) 的算法不同。这是交叉熵搭配 Sigmoid 的「漂亮」之处：Sigmoid 的导数和交叉熵的导数刚好约掉。

## 乳腺癌分类案例

使用 `scikit-learn` 内置的乳腺癌数据集（Breast Cancer Wisconsin），二分类：恶性 = 0，良性 = 1。

### 加载数据

```python
from sklearn.datasets import load_breast_cancer
import pandas as pd

data = load_breast_cancer()
X, y = data.data, data.target

print(f'样本数：{X.shape[0]}，特征数：{X.shape[1]}')
print(f'类别：{data.target_names}  →  0={data.target_names[0]}, 1={data.target_names[1]}')
print(f'各类别数量：恶性={sum(y == 0)}, 良性={sum(y == 1)}')

df = pd.DataFrame(X, columns=data.feature_names)
df['label'] = y
df.describe()
```

- 样本数量：569
- 特征数量：30
- 类别分布：恶性 (0) 212 个，良性 (1) 357 个

特征量纲差异很大，需要标准化后再训练。

### 预处理与训练

1. 划分数据集：80% 训练 / 20% 测试，`stratify=y` 保证类别比例一致
2. 标准化：用训练集的均值和标准差，应用到测试集
3. 训练模型：交叉熵损失，默认 L2 正则化

```python
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

model = LogisticRegression(max_iter=1000, random_state=42)
model.fit(X_train_scaled, y_train)

print(f'训练集准确率：{model.score(X_train_scaled, y_train):.4f}')
print(f'测试集准确率：{model.score(X_test_scaled,  y_test):.4f}')
```

- 训练集准确率 0.9890，测试集准确率 0.9825
- 两者都在 98% 左右且差距很小，拟合效果好、没有明显过拟合、泛化能力好
- 线性模型能有这个表现，说明乳腺癌特征与标签之间有较强的线性可分性

### 预测概率分布

逻辑回归不仅输出类别，还给出每个样本属于某类的概率。用直方图看两类样本的预测概率分布，能直观看出模型的区分能力。

```python
import numpy as np
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS']
plt.rcParams['axes.unicode_minus'] = False

proba = model.predict_proba(X_test_scaled)[:, 1]   # 良性（1）的概率
preds = model.predict(X_test_scaled)

proba_malignant = proba[y_test == 0]   # 真实恶性样本的预测概率
proba_benign    = proba[y_test == 1]   # 真实良性样本的预测概率

fig, ax = plt.subplots(figsize=(10, 4))
ax.hist(proba_malignant, bins=20, color='#e05c5c', alpha=0.7, label='真实：恶性 (0)', range=(0, 1))
ax.hist(proba_benign,    bins=20, color='#4a90d9', alpha=0.7, label='真实：良性 (1)', range=(0, 1))
ax.axvline(0.5, color='#333333', linewidth=1.5, linestyle='--', label='决策边界 p=0.5')
ax.set_xlabel(r'预测为良性的概率 $\hat{p}$', fontsize=12)
ax.set_ylabel('样本数', fontsize=12)
ax.set_title('逻辑回归预测概率分布（乳腺癌测试集）', fontsize=12, pad=12)
ax.legend(fontsize=10)
plt.tight_layout()
plt.show()
```

<!-- 图：materials/img0707PredictionDistribution.png -->

- **红色（恶性）** 集中在 0 附近：模型正确地给大部分恶性样本很低的良性概率
- **蓝色（良性）** 集中在 1 附近
- 两组分布 **几乎不重叠**，只有极少数样本落在决策边界附近，区分能力很强
- 少量红色出现在右侧、少量蓝色出现在左侧，那些就是 **分类错误的样本**

## 模型评估指标

回归用连续误差衡量（MSE / RMSE / R²）。分类输出的是离散标签，指标体系不同：

- 准确率 Accuracy：预测正确的样本比例
- 混淆矩阵 Confusion Matrix：分类评估的核心工具
- 精确率、召回率、F1
- ROC、AUC

### 混淆矩阵

把所有预测结果按「真实类别 × 预测类别」排成一张表：

| | 预测为正 | 预测为负 |
|---|---|---|
| **实际为正** | TP 真正例 ✅ | FN 假负例 ❌ 漏报 |
| **实际为负** | FP 假正例 ❌ 误报 | TN 真负例 ✅ |

- TP（True Positive）：实际正类，预测正类
- TN（True Negative）：实际负类，预测负类
- FP（False Positive）：实际负类，预测正类（误报）
- FN（False Negative）：实际正类，预测负类（漏报）

```python
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

y_pred = model.predict(X_test_scaled)
cm = confusion_matrix(y_test, y_pred)

fig, ax = plt.subplots(figsize=(5, 4))
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=['恶性 (0)', '良性 (1)'])
disp.plot(ax=ax, colorbar=False, cmap='Blues')
ax.set_title('混淆矩阵', fontsize=13, pad=12)
plt.tight_layout()
plt.show()

tn, fp, fn, tp = cm.ravel()
print(f'TP={tp}  FP={fp}  FN={fn}  TN={tn}')
```

<!-- 图：materials/img0708ConfusionMatrix.png -->

**结果分析**

- 对角线上的数字越大越好，代表预测正确的样本数
- 在这个数据集里 sklearn 默认把 **1 = 良性** 当作「正类」。医疗上危害最大的错误是「真实恶性却被判为良性」，在这个约定下它出现在 **FP** 的位置（实际 0、预测 1）。如果你更习惯把「恶性」当正类，把 `pos_label=0` 传给指标函数，它就变成 FN（漏报）。**先搞清哪个类别是正类，再读混淆矩阵。**
- 「误报恶性」（真实良性判成恶性）代价相对低，只是多做一次复查
- 混淆矩阵展示了模型在每个类别上的具体表现，是准确率之外最重要的参考

### 精确率 / 召回率 / F1

**精确率**（Precision）：预测为正类的样本中，真正是正类的比例。反映预测质量。

{{< math >}}
Precision = \frac{TP}{TP + FP}
{{< /math >}}

**召回率**（Recall）：所有真正的正类中，被成功找出来的比例。反映覆盖能力。

{{< math >}}
Recall = \frac{TP}{TP + FN}
{{< /math >}}

**F1**：精确率和召回率的调和平均。两者都高，F1 才高。

{{< math >}}
F1 = 2 \times \frac{Precision \times Recall}{Precision + Recall}
{{< /math >}}

精确率和召回率存在权衡：降低决策阈值可以提高召回率（漏报更少），但会降低精确率（误报更多）。按业务场景决定侧重哪个。

```python
from sklearn.metrics import classification_report, accuracy_score

print('准确率（Accuracy）:', accuracy_score(y_test, y_pred))
print()
print(classification_report(y_test, y_pred, target_names=['恶性 (0)', '良性 (1)']))
```

- **macro avg**：对每个类别单独计算后取平均，不考虑样本数差异
- **weighted avg**：按各类别样本量加权，更能反映整体表现
- 在乳腺癌场景，**恶性 (0) 这一行的召回率** 最重要：宁可误报，不能漏报
- 若召回率不足，可以调低（针对恶性的）决策阈值来提升，代价是牺牲部分精确率

### ROC 与 AUC

精确率 / 召回率依赖决策阈值（默认 0.5），换一个阈值结果就不同。**ROC 曲线** 遍历所有可能的阈值：

- 横轴 \(FPR = \dfrac{FP}{FP + TN}\)：假正率，负类被误判为正类的比例
- 纵轴 \(TPR = \dfrac{TP}{TP + FN}\)：真正率（召回率），正类被正确识别的比例

**AUC**（Area Under Curve）是 ROC 曲线下的面积，取值 \([0, 1]\)：

- AUC = 1.0：完美模型
- AUC = 0.5：随机猜测
- AUC 越大，区分正负类的能力越强，且 **与阈值无关**

```python
from sklearn.metrics import roc_curve, auc

proba = model.predict_proba(X_test_scaled)[:, 1]
fpr, tpr, thresholds = roc_curve(y_test, proba)
roc_auc = auc(fpr, tpr)

fig, ax = plt.subplots(figsize=(6, 5))
ax.plot(fpr, tpr, color='#4a90d9', lw=2, label=f'ROC 曲线（AUC = {roc_auc:.4f}）')
ax.fill_between(fpr, tpr, alpha=0.08, color='#4a90d9')
ax.plot([0, 1], [0, 1], color='#999999', lw=1.2, linestyle='--', label='随机猜测（AUC = 0.5）')

# 标出几个阈值对应的点
for thr, color in [(0.2, 'gold'), (0.5, 'red'), (0.8, 'blue')]:
    idx = (np.abs(thresholds - thr)).argmin()
    ax.scatter(fpr[idx], tpr[idx], c=color, s=40,
               label=f'阈值={thr} (TPR={tpr[idx]:.2f}, FPR={fpr[idx]:.2f})')

ax.set_xlabel('假正率（FPR）', fontsize=12)
ax.set_ylabel('真正率（TPR / 召回率）', fontsize=12)
ax.set_title('ROC 曲线', fontsize=13, pad=12)
ax.legend(fontsize=9)
ax.set_xlim([0, 1])
ax.set_ylim([0, 1.02])
plt.tight_layout()
plt.show()

print(f'AUC = {roc_auc:.4f}')
```

<!-- 图：materials/img0709AUC_ROC.png -->

- AUC 接近 1.0，ROC 曲线紧贴左上角：模型在任意阈值下都能较好区分恶性和良性
- 曲线越靠左上（高 TPR + 低 FPR）越好；对角虚线是随机猜测基准
- AUC 与阈值无关，比单一准确率更稳健，适合 **模型之间的横向对比**

> **补充**
> 类别极不均衡时（正类 1%），ROC 会显得过于乐观，这时看 **PR 曲线**（Precision–Recall）和 **AP（平均精确率）** 更能反映真实水平。

### 评估指标总结

| 指标 | 公式 | 适用场景 |
|---|---|---|
| 准确率 | \((TP + TN) / n\) | 类别均衡时的快速评估 |
| 精确率 | \(TP / (TP + FP)\) | 误报代价高（垃圾邮件过滤） |
| 召回率 | \(TP / (TP + FN)\) | 漏报代价高（疾病检测） |
| F1 | 精确率与召回率的调和平均 | 两者都重要的综合指标 |
| AUC | ROC 曲线下面积 | 与阈值无关的整体能力评估 |

## 多分类：Softmax 回归

逻辑回归天生是二分类器，扩展到多分类需要 **Softmax 回归**（也叫多项逻辑回归，Multinomial Logistic Regression），它一次输出所有类别的概率。

> **提示**
> Softmax 回归：每个类别都有一个线性打分函数算出 **独立得分**；Softmax 把所有得分转成 **概率分布**，所有类别的 **概率总和严格为 1**；取概率最大的类别作为预测。

{{< math >}}
Softmax(z_i) = \frac{e^{z_i}}{\sum_j e^{z_j}},
\qquad
P(y = k) = \frac{e^{z_k}}{\sum_{j=1}^{K} e^{z_j}}
{{< /math >}}

只有 2 个类别时，Softmax 退化成 Sigmoid。Sigmoid 是 Softmax 的特例。

### 通向深度学习

逻辑回归可以看作一个没有隐藏层的单层神经网络：

- 输入层：特征 \(x_1, x_2, \ldots\)
- 权重与偏置：连接权重 \(w\) 和偏置 \(b\)
- 激活函数：Sigmoid / Softmax
- 输出层：「线性 + Softmax」是现代神经网络分类任务最常用的输出层结构

## 总结

| 维度 | 线性回归 | 逻辑回归 |
|---|---|---|
| 解决什么问题 | 回归（预测数值） | 分类（预测类别） |
| 输出 | 任意实数 | 0～1 的概率 |
| 模型 | \(\hat{y} = wx + b\) | \(\hat{y} = \sigma(wx + b)\) |
| 损失函数 | MSE | 交叉熵 |
| 梯度公式 | \((\hat{y} - y) \cdot x\) | \((\hat{y} - y) \cdot x\) |
| 评估指标 | MSE / RMSE / R² | Accuracy / F1 / AUC |
| 正则化 | Ridge (L2) / Lasso (L1) | 同样适用，参数叫 \(C = 1/\lambda\) |

1. **逻辑回归 = 线性回归 + Sigmoid**，把输出压到 0～1
2. **损失函数必须换成交叉熵**，否则优化会出问题
3. **梯度公式和线性回归形式完全一样**，只是 \(\hat{y}\) 的算法不同
4. **分类不能只看准确率**，按业务场景选 Precision / Recall / F1
5. 逻辑回归 **可解释性强、训练快、配合正则化不容易过拟合**，工业界依然大量使用
