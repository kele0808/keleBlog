---
title: "机器学习笔记 10 · Boosting 模型"
date: 2026-09-24T10:40:00+08:00
draft: false
math: true
tags: ["机器学习", "Boosting", "GBDT", "XGBoost", "LightGBM", "CatBoost"]
categories: ["机器学习"]
series: "ml"
seriesOrder: 12
description: "Bagging 并行投票，Boosting 串行纠错。从函数空间的梯度下降理解 GBDT，用 30 行代码手搓一个，再看 XGBoost / LightGBM / CatBoost 各自改进了什么，最后在加州房价上对比随机森林与 XGBoost。"
summary: "每棵新树都在拟合前面模型的残差。MSE 下负梯度恰好就是残差，换别的损失函数照样能算。"
---

## 本节内容

1. Boosting 模型与集成学习
2. Boosting 串行训练原理
3. Bagging 与 Boosting 对比
4. 梯度提升决策树 GBDT
5. GBDT 代码实现演示
6. GBDT 优劣分析
7. 主流 Boosting 模型演进
8. Boosting 实战与对比
9. 总结

## Bagging vs Boosting

集成学习有两大主流思想：**Bagging** 和 **Boosting**。目标相同，都要把多个弱模型组成一个强模型，但实现路径不同。

### Bagging：少数服从多数

Bagging 指导随机森林，全称 **自举聚集**（Bootstrap Aggregating）：

- 有放回采样：对每棵树引入双重随机性（随机训练数据、随机特征），形成多样性
- 最终投票 / 平均：综合所有树的意见给出结果
- 代表算法：随机森林

### Boosting：接力纠错

- 串行训练：每棵树依次训练
- 专注错误：后树专注纠正前树的错误
- 累加预测：最终累加所有树的预测
- 代表算法：GBDT、XGBoost、LightGBM、CatBoost

<!-- 图：materials/img1001Golf.png -->

Boosting 的精髓：**每个新模型都在拟合前面模型的残差（错误），接力合作，逐步逼近真实答案。**

### 对比

| 维度 | Bagging（随机森林） | Boosting（梯度提升树） |
|---|---|---|
| 训练方式 | 多棵树 **并行独立** 训练 | 多棵树 **串行依次** 训练 |
| 每棵树的目标 | 学习 **原始目标** | 学习前面模型的 **残差** |
| 单棵树 | 深树，低偏差高方差 | 浅树，高偏差低方差 |
| 核心作用 | 降方差 | 降偏差 |

## GBDT 核心原理

梯度提升决策树（Gradient Boosting Decision Tree, GBDT）：

{{< math >}}
F(x) = h_1(x) + h_2(x) + h_3(x) + \cdots
{{< /math >}}

与线性回归有固定维度的参数 \(\theta\) 不同，GBDT 的优化方式是每轮添加一整棵新树 \(h_m(x)\)。

GBDT 作者 Friedman 把它类比为「函数空间里的梯度下降」：

| | 经典梯度下降 | GBDT |
|---|---|---|
| 优化对象 | 参数 \(\theta\)，一组数字 | 函数 \(F(x)\)，一个模型 |
| 当前状态 | 当前参数 \(\theta_{m-1}\) | 当前模型 \(F_{m-1}(x)\) |
| 下降方向 | 负梯度 \(-\dfrac{\partial L}{\partial \theta}\) | 负梯度 \(-\dfrac{\partial L}{\partial F(x)}\) |
| 更新方式 | \(\theta_m = \theta_{m-1} - \eta \dfrac{\partial L}{\partial \theta}\) | \(F_m(x) = F_{m-1}(x) + \eta \, h_m(x)\) |
| 每步操作 | 调整参数数值 | 添加新树 \(h_m(x)\) |

{{< math >}}
F_m(x) = F_0(x) + \eta \sum_{k=1}^{m} h_k(x)
{{< /math >}}

GBDT 每轮循环：

1. 计算每个样本上的负梯度，作为当前模型最该修正的方向
2. 训练一棵决策树拟合这些负梯度
3. 将该树乘以学习率 \(\eta\)，加到现有模型上，相当于沿下坡方向走一小步

**当损失函数是均方误差时，负梯度恰好是残差**：

{{< math >}}
\begin{aligned}
L &= \tfrac{1}{2}\,(y - F(x))^2 \\
-\frac{\partial L}{\partial F(x)} &= y - F(x) = \text{残差 (residual)}
\end{aligned}
{{< /math >}}

推广到其他损失函数，负梯度不再是简单的残差：

| 损失函数 | 负梯度（每棵新树拟合的目标） |
|---|---|
| 均方误差（MSE） | \(y - F(x)\)，即残差 |
| 绝对误差（MAE） | \(\text{sign}(y - F(x))\)，只有方向 ±1，对异常值更稳健 |
| 对数损失（分类） | \(y - p\)，真实标签减预测概率，这就是 GBDT 能做分类的原因 |

对任何能求导的损失函数，GBDT 都能算出负梯度并训练新树去拟合：

- **Gradient 梯度**：指优化方法，用负梯度指引新树的学习方向
- **Boosting 提升**：指最终效果，叠加多棵弱决策树提升模型表现

> **补充**
> 学习率 \(\eta\)（`learning_rate`）与树的数量 `n_estimators` 是一对耦合的超参数：\(\eta\) 越小每棵树贡献越保守，需要更多树，但通常泛化更好。常见做法是固定一个较小的 \(\eta\)（0.05～0.1），再用早停决定树的数量。

## GBDT 代码实现

### 手搓简版

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.tree import DecisionTreeRegressor

# 生成带噪声的正弦曲线数据
np.random.seed(42)
X = np.sort(np.random.rand(200, 1) * 10, axis=0)
y = np.sin(X).ravel() + np.random.randn(200) * 0.2

# 初始化参数
n_trees = 9                    # 树的总量
learning_rate = 0.3            # 学习率
trees = []                     # 树的容器
F = np.full_like(y, y.mean())  # 步骤 1：用均值初始化 F_0

# 准备绘图
plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS']
plt.rcParams['axes.unicode_minus'] = False
fig, axes = plt.subplots(3, 3, figsize=(16, 9))

# 建模训练
for i in range(n_trees):
    # 计算残差（MSE 下的负梯度）
    residual = y - F

    # 用一棵浅树拟合残差
    tree = DecisionTreeRegressor(max_depth=2)
    tree.fit(X, residual)
    pred = tree.predict(X)
    trees.append(tree)

    # 更新模型
    F += learning_rate * pred

    # 可视化
    mse = np.mean((y - F) ** 2)
    ax = axes[i // 3][i % 3]
    ax.scatter(X, y, s=10, alpha=0.4, color='steelblue', label='真实数据')
    ax.plot(X, F, color='tomato', linewidth=2, label='GBDT 预测')
    ax.set_title(f'第 {i + 1} 棵树后 | MSE = {mse:.4f}', fontsize=12)
    ax.legend(fontsize=9)

plt.suptitle('手搓 GBDT: 逐步逼近真实函数', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()
```

<!-- 图：materials/img1002GBDTregression.png -->

每棵新树都在查漏补缺，模型一轮比一轮精准：

- 第 1～3 棵树：红色曲线只是粗略的阶梯形，MSE 较大
- 第 4～6 棵树：曲线开始有正弦的轮廓，MSE 明显下降
- 第 7～9 棵树：曲线越来越贴合蓝色散点，MSE 持续缩小

### 观察残差

```python
fig, axes = plt.subplots(3, 3, figsize=(16, 9))

F = np.full_like(y, y.mean())

for i in range(n_trees):
    residual = y - F
    tree = DecisionTreeRegressor(max_depth=2)
    tree.fit(X, residual)
    F += learning_rate * tree.predict(X)

    ax = axes[i // 3][i % 3]
    ax.scatter(X, residual, s=10, alpha=0.5, color='darkorange')
    ax.axhline(y=0, color='gray', linestyle='--', linewidth=0.8)
    ax.set_title(f'第 {i + 1} 轮的残差', fontsize=12)
    ax.set_ylim(-1.5, 1.5)

plt.suptitle('残差逐轮缩小的过程', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()
```

<!-- 图：materials/img1003GBDTresidual.png -->

Boosting 逐步纠错：残差（橙色散点）逐轮向零线收敛。

## GBDT 优劣

优点：

1. **预测精度高**：在结构化 / 表格数据上表现优异
2. **处理混合特征**：数值型、类别型（需编码）均适用
3. **自带特征重要性**：帮助解释特征影响
4. **对特征缩放不敏感**：不需要标准化或归一化
5. **损失函数灵活**：适配多种业务需求

缺点：

1. **训练速度慢**：树之间串行，无法并行（单棵树内部可以并行）
2. **容易过拟合**：尤其数据少、噪声大时，需要仔细调参
3. **对超参数敏感**：学习率、树的数量、深度等都要认真调
4. **不擅长超高维稀疏数据**：如文本的 one-hot 编码
5. **原生无法直接处理类别特征**：经典 GBDT 需要手动编码

## 业界演进

### XGBoost

2014 年陈天奇开发 XGBoost（eXtreme Gradient Boosting）。核心改进：

- **正则化**：目标函数中显式加入树复杂度惩罚项（叶节点数量 + 叶节点权重的 L2 正则），有效防止过拟合
- **二阶梯度信息**：经典 GBDT 只用一阶梯度，XGBoost 同时利用二阶梯度（Hessian），分裂点选择更精准
- **工程优化**：列采样、缓存感知访问、核外计算，单机处理上亿样本成为可能
- **缺失值处理与早停**（Early Stopping）：训练过程更可控

### LightGBM

2017 年微软推出 LightGBM，大数据集上训练速度比 XGBoost 快数倍。核心改进：

- **直方图算法**：把连续特征分桶成离散直方图，寻找分裂点时只需遍历桶，计算量大幅下降、内存占用小（XGBoost 后续也加入了 `tree_method='hist'`）
- **带深度限制的 Leaf-wise 生长**：传统决策树逐层生长（level-wise），LightGBM 每次选增益最大的叶子往下长（leaf-wise），得到非对称树，同等叶子数下精度更高，但需限制深度防过拟合
- **两项加速技术**：
  1. 单边梯度采样（Gradient-based One-Side Sampling, GOSS）
  2. 互斥特征捆绑（Exclusive Feature Bundling, EFB）

### CatBoost

2017 年 Yandex 推出 CatBoost（Categorical Boosting），在类别特征多的业务场景表现突出。核心改进：

- **原生支持类别特征**：XGBoost 需要开发者手动做 One-hot 等编码，CatBoost 内置 Ordered Target Statistics 自动处理
- **排序提升**（Ordered Boosting）：GBDT 家族有「预测偏移」隐患，即样本自己的目标值参与了给它建模的过程；CatBoost 通过随机排列，让每个样本只用排在它前面的样本来计算统计量，提升泛化
- **对称树结构**（Oblivious Trees）：同一层用同一个分裂条件，推理速度显著快于 XGBoost 和 LightGBM

### 三者对比

| 场景 | 推荐框架 |
|---|---|
| 需要极致精度，如 Kaggle 竞赛 | XGBoost 或 LightGBM |
| 需要快速训练，大数据集（> 100 万样本） | LightGBM |
| 需要处理大量类别特征 | CatBoost |

## XGBoost 演示

### 准备数据

```python
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split

# 加载加州房价数据集
data = fetch_california_housing()
X, y = data.data, data.target
feature_names = data.feature_names

# 划分训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"训练集大小: {X_train.shape}")
print(f"测试集大小: {X_test.shape}")
print(f"特征: {feature_names}")
```

### 训练模型

随机森林：

```python
import time
from sklearn.ensemble import RandomForestRegressor

rf_start = time.time()
rf = RandomForestRegressor(
    n_estimators=200,   # 200 棵树
    max_depth=10,       # 最深 10 层
    random_state=42,
    n_jobs=-1           # CPU 并行加速
)
rf.fit(X_train, y_train)
rf_time = time.time() - rf_start
rf_pred = rf.predict(X_test)
```

XGBoost（需 `pip install xgboost`）：

```python
from xgboost import XGBRegressor

xgb_start = time.time()
xgb = XGBRegressor(
    n_estimators=200,        # 200 棵树
    max_depth=5,             # 最深 5 层
    learning_rate=0.1,       # 学习率
    subsample=0.8,           # 每棵树抽取的样本比例
    colsample_bytree=0.8,    # 每棵树抽取的特征比例
    random_state=42,
    n_jobs=-1,
)
xgb.fit(X_train, y_train)
xgb_time = time.time() - xgb_start
xgb_pred = xgb.predict(X_test)
```

### 对比结果

```python
from sklearn.metrics import mean_squared_error, r2_score

print("=" * 50)
print(f"{'指标':<15}{'随机森林':>12}{'XGBoost':>12}")
print("=" * 50)
print(f"{'MSE':<15} {mean_squared_error(y_test, rf_pred):>12.4f} "
      f"{mean_squared_error(y_test, xgb_pred):>12.4f}")
print(f"{'R² Score':<15} {r2_score(y_test, rf_pred):>12.4f} "
      f"{r2_score(y_test, xgb_pred):>12.4f}")
print(f"{'训练时间(秒)':<15} {rf_time:>12.2f} {xgb_time:>12.2f}")
```

| 指标 | 随机森林 | XGBoost |
|---|---|---|
| MSE | 0.2951 | 0.2183 |
| R² Score | 0.7748 | 0.8334 |
| 训练时间（秒） | 0.83 | 0.35 |

对比第 05 章线性回归的 R² ≈ 0.58，树模型集成提升明显；XGBoost 又比随机森林更准也更快。

### 早停防过拟合

XGBoost 的实用功能 **Early Stopping**：验证集上的性能连续若干轮不再提升时，自动停止训练。

> **注意**
> 早停用的验证集要从 **训练集** 里再切一份出来，不能直接用测试集。用测试集选停止轮数，等于让测试集参与了模型选择，最终报告的测试分数会偏乐观。

```python
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

# 从训练集中再切出 20% 作为验证集
X_tr, X_val, y_tr, y_val = train_test_split(
    X_train, y_train, test_size=0.2, random_state=42
)

xgb_es = XGBRegressor(
    n_estimators=10000,        # 设一个很大的上限
    max_depth=5,
    learning_rate=0.05,        # 更小的学习率
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    early_stopping_rounds=20   # 20 轮不提升就停止
)

xgb_es.fit(
    X_tr, y_tr,
    eval_set=[(X_val, y_val)],
    verbose=50                 # 每 50 轮打印一次
)

print(f"\n最佳迭代轮数: {xgb_es.best_iteration}")
print(f"测试集 MSE: {mean_squared_error(y_test, xgb_es.predict(X_test)):.4f}")
```

原笔记直接用测试集做 `eval_set`，得到最佳迭代轮数 862、MSE 0.1963。改成独立验证集后数字会略有变化，但这才是可以对外报告的结果。

Early Stopping 让人不必预估树的总量：预设一个足够大的上限，让算法自己找到最佳停止点。

### 可视化训练过程

```python
import matplotlib.pyplot as plt

# 获取训练过程中的损失变化
results = xgb_es.evals_result()

plt.figure(figsize=(10, 5))
plt.plot(results['validation_0']['rmse'], color='tomato', linewidth=2)
plt.xlabel('迭代轮数（树的数量）')
plt.ylabel('RMSE')
plt.title('XGBoost 训练过程：验证集误差随迭代轮数的变化')
plt.axvline(x=xgb_es.best_iteration, color='gray',
            linestyle='--', label=f'最佳轮数={xgb_es.best_iteration}')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()
```

<!-- 图：materials/img1004XGBoostTrain.png -->

验证集 RMSE 先快速下降，然后趋于平缓，最后可能略微上升（过拟合信号）。Early Stopping 恰好在最低点附近停下来。

## 总结

对决策树以及基于它的两大集成分支做个总结：

| | 决策树 | 随机森林 | GBDT / XGBoost |
|---|---|---|---|
| 模型数量 | 1 棵 | 多棵（并行） | 多棵（串行） |
| 集成策略 | 无 | Bagging：投票 / 平均 | Boosting：逐步累加 |
| 单棵树特点 | 可深可浅 | 深树（低偏差高方差） | 浅树（高偏差低方差） |
| 核心目标 | 基线模型 | 降低方差 | 降低偏差 |
| 过拟合风险 | 高 | 低 | 中等（靠早停 / 正则控制） |
| 训练速度 | 快 | 较快（可并行） | 较慢（串行） |
| 预测精度 | 一般 | 好 | 通常最好 |

- **决策树** 是基础模型：简单直观，但容易过拟合
- **随机森林** 用 Bagging，让多棵树并行投票，降低方差
- **GBDT** 用 Boosting，让多棵树串行纠错，降低偏差
- **XGBoost / LightGBM / CatBoost** 是 GBDT 的工业级进化，更快、更准、更易用

面对结构化的表格数据，GBDT 家族（尤其 XGBoost 和 LightGBM）几乎是默认首选，它们在无数 Kaggle 竞赛和工业场景中证明了自己。
