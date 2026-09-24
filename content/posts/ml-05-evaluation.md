---
title: "机器学习笔记 05 · 模型评估"
date: 2026-09-24T09:50:00+08:00
draft: false
math: true
tags: ["机器学习", "模型评估", "交叉验证", "回归指标"]
categories: ["机器学习"]
series: "ml"
seriesOrder: 7
description: "以加州房价为例：先跑 Baseline，再用 MAE / MSE / RMSE / R² 四个回归指标评估，做残差分析，最后用 K 折交叉验证消除单次划分的随机性。"
summary: "评估要回答三个问题：预测和真实差多少、怎么量化、这个分数可信吗。指标给全局数字，残差图给具体表现，交叉验证给统计稳定性。"
---

## 本节内容

1. 评估模型的必要性
2. 建立基线模型
3. 回归评估指标详解
4. 基线模型评估与残差分析
5. 交叉验证诊断
6. 过拟合与欠拟合预告

## 基线模型 Baseline

**基线模型**是首个快速实现、相对简单但流程完整的模型。它是后续深入评估的可靠起点，也是所有优化的参照基准。后面所有的「花活」都得先超过它，才说明有价值。

### 加州房价案例

- 样本规模：20,640 条记录
- 8 个特征：街区家庭收入中位数、房龄、平均房间数、平均卧室数、街区人口、平均家庭人口、纬度、经度
- 预测目标：各街区房屋价格中位数，单位 **10 万美元**

目标变量的最大值刚好是 5.00。这是数据采集时做了 **截断**：所有超过 50 万美元的房价都被统一记为 5.0。这个操作会在后面的残差分析中产生明显的「截断效应」。

### 加载数据

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

housing = fetch_california_housing()
X = pd.DataFrame(housing.data, columns=housing.feature_names)
y = housing.target   # 房价中位数（单位：10万美元）

print(f"样本数: {X.shape[0]}，特征数: {X.shape[1]}")
print(f"目标变量范围: [{y.min():.2f}, {y.max():.2f}]，均值: {y.mean():.2f}")
print(X.head())
```

### 划分与预处理

```python
# 先划分
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"训练集: {X_train.shape[0]} 样本")
print(f"测试集: {X_test.shape[0]} 样本")

# 标准化 + 线性回归打包成 Pipeline，scaler 只会在训练集上 fit
model = make_pipeline(StandardScaler(), LinearRegression())
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
```

> **补充**
> 上一章刚说过「先划分再预处理」，这里就照做：把 `StandardScaler` 放进 Pipeline，让它只学训练集的均值和标准差。对普通最小二乘线性回归来说，是否标准化不影响预测结果（只是换了坐标），但养成习惯很重要，一旦换成带正则化的模型或梯度下降训练，先缩放再划分就是泄漏。

### 检视预测

```python
for i in range(10):
    print(f"真实值: {y_test[i]:.3f}, 预测值: {y_pred[i]:.3f}")
```

`y_pred` 是模型对测试集的预测，`y_test` 是真实值。评估要解决三个问题：

1. 计算二者的差异
2. 如何量化差异
3. 区分不同类型的差异

## 回归模型评估指标

模型训练完成后，要在测试集上评估其泛化能力。回归任务有四个核心指标：MAE、MSE、RMSE、\(R^2\)。不同指标对误差的敏感度不同，要结合业务场景选择。

### 平均绝对误差 MAE

{{< math >}}
MAE = \frac{1}{n} \sum_{i=1}^{n} \left| y_i - \hat{y}_i \right|
{{< /math >}}

- 核心思想：预测值与真实值偏差的绝对值，再求平均
- 优点：单位与目标变量一致，直观易懂；对 **异常值相对不敏感**，不会过度放大极端错误
- 缺点：绝对值在零点不可导，作为损失函数优化时不如平方项方便

> **提示**
> 它的单位和目标变量一致，是所有指标中最容易解释的。

### 均方误差 MSE

{{< math >}}
MSE = \frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2
{{< /math >}}

- 核心思想：偏差的平方，再求平均
- 优点：平方会 **显著放大大误差的影响**，适合对大误差零容忍的场景（医疗、自动驾驶）
- 缺点：单位变成目标单位的平方（「平方万元」），失去直观业务含义

偏差为 10 的样本，在 MSE 中的惩罚是偏差为 1 的样本的 100 倍，在 MAE 中只是 10 倍。

> **提示**
> MSE 也是梯度下降训练时最常用的损失函数。

### 均方根误差 RMSE

{{< math >}}
RMSE = \sqrt{MSE} = \sqrt{\frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2}
{{< /math >}}

- 核心思想：对 MSE 开根号
- 优点：单位还原到与目标一致，容易解释；继承了 MSE 对大误差敏感的特点

> **提示**
> 在实际工程和数据科学竞赛（Kaggle）中，RMSE 常作为回归任务的默认标准。

### 决定系数 R²

{{< math >}}
R^2 = 1 - \frac{\sum_i (y_i - \hat{y}_i)^2}{\sum_i (y_i - \bar{y})^2}
{{< /math >}}

- 核心思想：相对于「直接用均值预测」，模型好了多少
- 无量纲，衡量模型解释了总方差中多大比例，可在不同数据集之间横比
- 解读：
  1. \(R^2 = 1\)：完美预测
  2. \(R^2 = 0\)：与均值预测等效，没学到有效特征
  3. \(R^2 < 0\)：比猜均值还差，模型选择或设计有严重问题

### 基线模型评估结果

```python
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

mae = mean_absolute_error(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_pred)

print(f"MAE:  {mae:.4f}  （平均偏差 {mae * 10:.2f} 万美元）")
print(f"MSE:  {mse:.4f}")
print(f"RMSE: {rmse:.4f}  （平均偏差 {rmse * 10:.2f} 万美元）")
print(f"R²:   {r2:.4f}  （解释了 {r2 * 100:.1f}% 的方差）")
```

### 结果解读

- **MAE = 0.5332**：目标单位是 10 万美元，所以模型预测平均偏离真实房价约 **5.3 万美元**（不是 5,332 美元，单位换算别漏了一个数量级）
- **RMSE = 0.7456**：约 7.5 万美元
  1. RMSE 大于 MAE，说明存在一些偏差较大的样本把 RMSE 拉高了
  2. RMSE 和 MAE 差距越大，误差分布越不均匀，离群误差越多
- **R² = 0.5757**：
  1. 模型解释了约 57.6% 的房价方差
  2. 剩余 42.4% 来自模型未捕获的因素：可能特征不够，也可能线性假设太强
  3. 对只用 8 个特征的线性模型，这是合理的起点，但提升空间明确

### 指标选择原则

| 场景 | 推荐指标 | 原因 |
|---|---|---|
| 对大误差零容忍（金融风控、安全领域） | MSE / RMSE | 平方惩罚放大大误差，优化时优先减少极端偏差 |
| 数据有离群点，需要稳健度量 | MAE | 不受个别极端值过度影响 |
| 不同量纲 / 数据集的横向对比 | R² | 无量纲，通常在 0～1 |
| 向非技术背景的业务方汇报 | RMSE / MAE | 单位与目标一致，容易解释 |

## 残差分析

误差指标给出全局性的数字，**残差**（Residual）分析能反映模型的具体优劣表现：

{{< math >}}
e_i = y_i - \hat{y}_i \qquad (\text{残差} = \text{真实值} - \text{预测值})
{{< /math >}}

理想模型的残差全为零。现实中，残差的分布能反映数据的结构信息。

```python
residuals = y_test - y_pred

fig, axes = plt.subplots(1, 3, figsize=(18, 5))

# 图 1：预测值 vs 真实值
axes[0].scatter(y_test, y_pred, alpha=0.3, s=10, color='steelblue')
axes[0].plot([0, 5], [0, 5], 'r--', linewidth=2, label='Perfect prediction')
axes[0].set_xlabel('Actual', fontsize=12)
axes[0].set_ylabel('Predicted', fontsize=12)
axes[0].set_title('预测值与真实值对比图', fontsize=13)
axes[0].legend()

# 图 2：残差 vs 预测值
axes[1].scatter(y_pred, residuals, alpha=0.3, s=10, color='steelblue')
axes[1].axhline(y=0, color='r', linestyle='--', linewidth=2)
axes[1].set_xlabel('Predicted', fontsize=12)
axes[1].set_ylabel('Residuals', fontsize=12)
axes[1].set_title('残差与预测值关系图', fontsize=13)

# 图 3：残差分布
axes[2].hist(residuals, bins=50, edgecolor='black', color='steelblue', alpha=0.7)
axes[2].axvline(x=0, color='r', linestyle='--', linewidth=2)
axes[2].set_xlabel('Residual', fontsize=12)
axes[2].set_ylabel('Count', fontsize=12)
axes[2].set_title('残差分布直方图', fontsize=13)

plt.tight_layout()
plt.show()

print(f"残差均值: {residuals.mean():.4f}")
print(f"残差标准差: {residuals.std():.4f}")
print(f"残差偏度: {pd.Series(residuals).skew():.4f}")
```

<!-- 图：materials/img0501Residual.png -->

### 预测值与真实值对比图

- 理想：所有点落在红色对角线上
- 实际：点大致沿对角线分布，模型整体有预测能力，但有系统性偏差：
  1. 真实值较高时，点落在红线下方，即预测普遍偏低。**模型倾向于低估高价房产**
  2. 右侧出现 **垂直聚集**：大量真实值为 5.0 的样本，正是前面提到的截断效应

### 残差与预测值关系图

- 理想：散点均匀、随机地分布在零线两侧
- 实际：预测值增大，残差发散程度也变大，呈漏斗形。**模型预测高房价时很不稳定**，这叫异方差

### 残差分布直方图

- 理想：近似正态、均值为 0
- 实际：峰值集中在零附近，但整体 **右偏且带长尾**。再次印证模型对部分高房价样本严重低估

## 交叉验证

单次 `train/test split` 有「依赖运气」的隐患：换一个 `random_state`，R² 可能从 0.57 变成 0.60 或 0.55。如何判断 0.57 反映的是模型真实水平，而不是单次划分的运气？

为获得稳定、统计上可靠的评估结果，采用 **K 折交叉验证**。

### K-Fold

1. 把数据均分为 K 份
2. 每轮取 1 份作验证集，其余 K−1 份作训练集
3. 重复 K 轮，报告 K 次评估结果的均值和标准差

### 单指标 RMSE

```python
from sklearn.model_selection import cross_val_score

# cross_val_score 内部完成 fit 和 predict，不需要手动划分
# 用 Pipeline 保证每一折的 scaler 只在该折的训练部分 fit
scores = cross_val_score(
    make_pipeline(StandardScaler(), LinearRegression()), X, y,
    cv=5,                              # 5 折
    scoring='neg_mean_squared_error'   # sklearn 约定 scoring 越大越好，所以 MSE 取负
)

rmse_scores = np.sqrt(-scores)

print("每折 RMSE:")
for i, score in enumerate(rmse_scores):
    print(f"  Fold {i + 1}: {score:.4f}")
print(f"\n平均 RMSE: {rmse_scores.mean():.4f} ± {rmse_scores.std():.4f}")
print(f"标准差相对均值约 {rmse_scores.std() / rmse_scores.mean() * 100:.2f}%")
```

平均 RMSE \(0.7459 \pm 0.0437\)，标准差相对均值约 5.9%。说明线性回归在不同划分下表现稳定。

### 多指标 RMSE + MAE + R²

一次算多个指标，用 `cross_validate`：

```python
from sklearn.model_selection import cross_validate

cv_results = cross_validate(
    make_pipeline(StandardScaler(), LinearRegression()), X, y,
    cv=5,
    scoring={
        'rmse': 'neg_root_mean_squared_error',
        'mae': 'neg_mean_absolute_error',
        'r2': 'r2'
    },
    return_train_score=True   # 同时返回训练集得分，用于诊断过拟合
)

print(f"{'指标':<12} {'训练集':>12} {'测试集':>12} {'差距':>10}")
print("-" * 48)
for metric in ['rmse', 'mae', 'r2']:
    train_mean = cv_results[f'train_{metric}'].mean()
    test_mean = cv_results[f'test_{metric}'].mean()
    if metric != 'r2':          # 去掉负号
        train_mean, test_mean = -train_mean, -test_mean
    gap = abs(train_mean - test_mean)
    print(f"{metric.upper():<12} {train_mean:>12.4f} {test_mean:>12.4f} {gap:>10.4f}")
```

| 指标 | 训练集 | 测试集 | 差距 |
|---|---|---|---|
| RMSE | 0.7218 | 0.7459 | 0.0241 |
| MAE | 0.5297 | 0.5475 | 0.0178 |
| R² | 0.6071 | 0.5530 | 0.0541 |

1. **训练集和测试集指标非常接近**：模型没有过拟合。过拟合的特征是训练集很好、测试集很差
2. **训练集本身表现也不算出色**：R² 只有 0.61，模型可能 **没有充分挖掘数据中的信息**，即 **欠拟合**。下一章展开

> **补充**
> 默认的 `cv=5` 是不打乱顺序的 KFold。如果数据按某种顺序排列（比如按地区），最好用 `KFold(shuffle=True, random_state=42)`；分类任务用 `StratifiedKFold` 保持每折类别比例；时间序列用 `TimeSeriesSplit`，不能让未来数据泄漏到过去。
