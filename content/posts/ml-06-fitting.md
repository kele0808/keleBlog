---
title: "机器学习笔记 06 · 拟合诊断"
date: 2026-09-24T10:00:00+08:00
draft: false
math: true
tags: ["机器学习", "过拟合", "欠拟合", "正则化", "学习曲线"]
categories: ["机器学习"]
series: "ml"
seriesOrder: 8
description: "泛化能力是目标，欠拟合和过拟合是两大障碍。用多项式回归和学习曲线做诊断，再分别给出解法：特征工程与复杂模型对付欠拟合，L1 / L2 正则化等对付过拟合。"
summary: "欠拟合做加法，过拟合做减法。学习曲线一眼看出是哪种问题；Ridge 把权重压小，Lasso 把权重压成零。"
---

## 本节内容

1. 目标与泛化能力
2. 欠拟合
3. 过拟合
4. 诊断工具：学习曲线
5. 解决欠拟合
6. 解决过拟合
7. 核心方法：正则化
8. 正则化效果对比
9. 总结

## 泛化能力

机器学习的目标是训练出能捕捉数据背后潜在规律的模型。**泛化能力**指模型不仅能拟合训练数据，还能对陌生的新数据做出准确预测。

模型并不总能具备良好的泛化能力：学习太少会欠拟合，学习太多会过拟合。

## 拟合问题

### 欠拟合 Underfitting

模型过于简单，未能充分学习训练数据中的规律。**在训练集和测试集上的表现都很差。**

### 过拟合 Overfitting

模型过于复杂，不仅学习了数据中的真实规律，也把 **噪音** 一并记住。**在训练集上表现优异，但在测试集上表现退步。**

### 对比

| | 恰好拟合 | 欠拟合 | 过拟合 |
|---|---|---|---|
| 训练集表现 | 好 | 差 | 很好 |
| 测试集表现 | 好 | 差 | 差 |
| 核心问题 | 充分习得规律 | 未充分学到规律 | 把噪音当规律学了 |

> **补充**
> 这对问题在统计学里叫 **偏差–方差权衡**（Bias–Variance Tradeoff）：欠拟合是高偏差，过拟合是高方差。后面讲随机森林「降方差」、GBDT「降偏差」时会再遇到这两个词。

## 学习曲线

学习曲线是诊断拟合问题的直观工具：展示随着训练样本数量增加，训练误差和验证误差的变化趋势。

### 模拟数据

假设真实规律是 \(y = x^2\)，加上随机噪声生成训练数据，用不同复杂度的多项式去拟合：

- **degree = 1**：线性模型，无法捕捉二次关系，欠拟合
- **degree = 2**：与真实生成过程匹配，良好拟合
- **degree = 15**：高次多项式，过度拟合噪声，过拟合

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import learning_curve
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline

plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# 数据准备
np.random.seed(42)
n_samples = 100
X = np.sort(np.random.uniform(-3, 3, n_samples)).reshape(-1, 1)   # [-3, 3] 均匀采样
y = X.ravel() ** 2 + np.random.normal(0, 1, n_samples)             # y = x² + 高斯噪声

# 三个不同复杂度的模型
# PolynomialFeatures 给原始特征添加平方项、交叉项等
models = {
    "欠拟合 (degree=1)": make_pipeline(PolynomialFeatures(1), LinearRegression()),
    "良好拟合 (degree=2)": make_pipeline(PolynomialFeatures(2), LinearRegression()),
    "过拟合 (degree=15)": make_pipeline(PolynomialFeatures(15), LinearRegression()),
}
```

### 直观对比

```python
fig, axes = plt.subplots(1, 3, figsize=(18, 5))
X_test = np.linspace(-3, 3, 200).reshape(-1, 1)   # 用于画平滑预测曲线

for ax, (title, model) in zip(axes, models.items()):
    model.fit(X, y)
    y_pred = model.predict(X_test)

    ax.scatter(X, y, color='steelblue', s=30, alpha=0.6, label='训练数据')
    ax.plot(X_test, X_test.ravel() ** 2, '--', color='gray', linewidth=2, label='真实函数 $y=x^2$')
    ax.plot(X_test, y_pred, '-', color='tomato', linewidth=2, label='模型预测')

    ax.set_title(title, fontsize=14)
    ax.set_xlabel('x')
    ax.set_ylabel('y')
    ax.legend()
    ax.grid(True, alpha=0.3)
    ax.set_xlim(-3.5, 3.5)
    ax.set_ylim(-1, 12)

plt.tight_layout()
plt.show()
```

<!-- 图：materials/img0601FittingComparsion.png -->

- **图 1 欠拟合**：\(y = wx + b\)。直线无法拟合抛物线，无论怎么调斜率和截距，都捕捉不到弯曲趋势
- **图 2 良好拟合**：\(y = w_1 x^2 + w_2 x + b\)。形式与真实规律匹配，精准捕捉抛物线趋势，不被噪声带偏
- **图 3 过拟合**：\(y = w_1 x^{15} + w_2 x^{14} + \cdots + w_{15} x + b\)。曲线精确穿过每一个训练点，包括受噪声干扰偏离规律的点，形状扭曲怪异

### 学习曲线

`learning_curve` 自动用不同数量的训练数据训练模型，分别计算训练集得分（学自己见过的数据有多好）和验证集得分（学没见过的数据有多好），画出两条曲线。

```python
fig, axes = plt.subplots(1, 3, figsize=(18, 5))

for ax, (title, model) in zip(axes, models.items()):
    # train_sizes: 训练集大小
    # train_scores / val_scores: 各大小下的得分 (shape: [n_sizes, n_cv_folds])
    train_sizes, train_scores, val_scores = learning_curve(
        model, X, y,
        train_sizes=np.linspace(0.1, 1.0, 10),   # 10%, 20%, ..., 100%
        cv=5,
        scoring="neg_mean_squared_error",
    )

    train_mse = -train_scores.mean(axis=1)
    val_mse   = -val_scores.mean(axis=1)

    ax.plot(train_sizes, train_mse, "o-", color="steelblue", label="训练误差")
    ax.plot(train_sizes, val_mse,   "o-", color="tomato",    label="验证误差")
    ax.set_title(title, fontsize=14)
    ax.set_xlabel("训练样本数")
    ax.set_ylabel("MSE")
    ax.legend()
    ax.set_yscale("log")   # 对数刻度，便于展示差异巨大的误差
    ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()
```

<!-- 图：materials/img0602LearningRate.png -->

- **图 1 欠拟合**：验证误差始终和训练误差很接近，且都在高位（约 20～100）。模型太简单，既学不会训练数据，也泛化不好
- **图 2 良好拟合**：初始验证误差很高，随样本增加快速下降，最后和训练误差几乎重合，都在低位（5～10）
- **图 3 过拟合**：训练误差几乎为 0，验证误差始终远高于训练误差，数值巨大（10⁸）。模型过度学习了噪声，完全无法泛化

| 模式 | 训练误差 | 验证误差 | 两者关系 |
|---|---|---|---|
| 欠拟合 | 高 | 高 | 都高且差距小，加数据也没用 |
| 良好拟合 | 低 | 低 | 都低，逐渐收敛 |
| 过拟合 | 很低 | 高 | 差距大，加数据可能有帮助 |

## 解决欠拟合

欠拟合意味着模型太简单，核心思路是 **让模型更有表达力**。

### 特征工程

解决欠拟合最常用、最有效的方法之一。构造更有信息量的特征，简单模型也能有好效果。

| 方法 | 说明 | 示例 |
|---|---|---|
| 多项式特征 | 添加高次项和交互项 | \(x_1, x_2 \rightarrow x_1, x_2, x_1^2, x_2^2, x_1 x_2\) |
| 特征交叉 | 组合两个或多个特征 | 面积 = 长 × 宽 |
| 数学变换 | 对数、平方根、指数 | \(\log(income)\) |
| 领域特征 | 结合业务知识构造 | 从日期提取「是否周末」 |
| 分箱 | 连续值离散化 | 年龄 → 青年 / 中年 / 老年 |

### 增加训练轮数

如果模型还没训练到收敛就停了，自然表现不佳。检查训练过程中损失是否仍在下降，适当增加 epochs，直到损失不再下降。

### 增加模型复杂度

从简单模型（线性回归）切换到复杂模型（决策树、随机森林）。上一章的加州房价，线性回归 R² 只到 0.57，换成树模型会显著提升：

```python
import numpy as np
import pandas as pd
from sklearn.datasets import fetch_california_housing
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_squared_error

housing = fetch_california_housing()
X = pd.DataFrame(housing.data, columns=housing.feature_names)
y = housing.target

# 先划分；缩放放进 Pipeline，树模型不需要缩放
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

models = {
    "线性回归": make_pipeline(StandardScaler(), LinearRegression()),
    "决策树 (max_depth=5)": DecisionTreeRegressor(max_depth=5, random_state=42),
    "随机森林 (100棵树)": RandomForestRegressor(
        n_estimators=100, max_depth=10, random_state=42, n_jobs=-1
    ),
}

results = []
for name, model in models.items():
    model.fit(X_train, y_train)
    train_pred, test_pred = model.predict(X_train), model.predict(X_test)
    train_r2, test_r2 = r2_score(y_train, train_pred), r2_score(y_test, test_pred)
    results.append({
        "模型": name,
        "训练 R²": train_r2,
        "测试 R²": test_r2,
        "训练 MSE": mean_squared_error(y_train, train_pred),
        "测试 MSE": mean_squared_error(y_test, test_pred),
        "差距 (R²)": train_r2 - test_r2,
    })

df_results = pd.DataFrame(results)
print("=" * 80)
print(df_results.to_string(index=False, float_format="%.4f"))
```

## 解决过拟合

过拟合意味着模型太复杂，记住了训练数据的噪声。核心思路是 **让模型别太极端**。

| 技术 | 核心思想 | 适用场景 |
|---|---|---|
| 增加训练数据 | 更多数据稀释噪声 | 数据获取成本低时 |
| 正则化 | 给模型复杂度加惩罚 | 最通用的方法 |
| 降低模型复杂度 | 用更简单的模型 | 模型明显过于复杂时 |
| 特征选择 | 去掉无关或冗余特征 | 特征多而样本少 |
| 交叉验证 | 更可靠地评估泛化 | 所有场景 |
| 早停 | 验证误差开始上升时停下 | 迭代式模型（神经网络 / GBDT） |
| Dropout | 随机丢弃神经元 | 深度学习 |
| 数据增强 | 通过变换扩充训练集 | 图像 / 文本 / 音频 |

### 正则化

**正则化**（Regularization）本意是使之变得规则、整齐、正常。没有正则化时模型会疯狂拟合变得不正常；加上正则化，让模型别太极端、别太复杂，回归平滑的简单形态。

在多项式演示中，用 15 次多项式拟合 \(y = x^2\)：

{{< math >}}
\hat{y} = w_0 + w_1 x + w_2 x^2 + \cdots + w_{15} x^{15}
{{< /math >}}

为了穿过每个带噪声的点，部分系数会发展成极端值（比如 \(w_5 = 387.2, w_7 = -1042.8\)），曲线剧烈震荡。

普通线性回归的损失函数只关注拟合准确度，完全不管系数大小：

{{< math >}}
J(w) = \frac{1}{2n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2
{{< /math >}}

正则化的核心思想：**在损失函数中额外加一个惩罚项，系数越大惩罚越重**，迫使模型尽量用小的系数拟合。两种方式：

#### L2 正则化：Ridge 岭回归

惩罚所有权重的 **平方和**：

{{< math >}}
J_{Ridge}(w) = MSE + \alpha \sum_j w_j^2
{{< /math >}}

把所有权重均匀压缩到接近 0 的小值，但 **不会恰好等于 0**。当所有特征都对预测有一定贡献，或特征间存在多重共线性时，L2 表现最稳定。

#### L1 正则化：Lasso

最小绝对值收缩与选择算子（Least Absolute Shrinkage and Selection Operator）。惩罚所有权重的 **绝对值之和**：

{{< math >}}
J_{Lasso}(w) = MSE + \alpha \sum_j \left| w_j \right|
{{< /math >}}

会把不重要特征的权重直接 **压缩到 0**，相当于自动做了 **特征选择**。当特征很多但真正起作用的只是少数时，L1 非常有价值。

> **补充**
> 为什么 L1 能产生零而 L2 不能？直觉上，L2 惩罚在 \(w \to 0\) 时梯度也趋于 0，推力越来越小；L1 惩罚的梯度是常数 \(\pm\alpha\)，一直有推力把小权重推到零点。两者结合叫 **Elastic Net**。\(\alpha\)（有的库叫 \(\lambda\)）越大惩罚越狠；逻辑回归里习惯用 \(C = 1/\lambda\)，\(C\) 越小正则越强。

### 用正则化解决过拟合

> **注意**
> 正则化之前务必先做标准化。高次项（如 \(x^{15}\)）数值极大，不缩放会导致对各系数的惩罚极不公平。

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.pipeline import make_pipeline

plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS']
plt.rcParams['axes.unicode_minus'] = False

# 1. 生成带噪声的 y = x² 数据
np.random.seed(42)
n_samples = 30
X_train = np.sort(np.random.uniform(-3, 3, n_samples)).reshape(-1, 1)
y_train = X_train.ravel() ** 2 + np.random.normal(0, 1.5, n_samples)
X_plot = np.linspace(-3.5, 3.5, 200).reshape(-1, 1)

# 2. 三个 15 次多项式模型；先 PolynomialFeatures，再 StandardScaler，再回归器
degree = 15
models = {
    "普通线性回归\n(无正则化, 过拟合)": make_pipeline(
        PolynomialFeatures(degree), StandardScaler(), LinearRegression()
    ),
    "Ridge (L2 正则化)\n(所有权重变小)": make_pipeline(
        PolynomialFeatures(degree), StandardScaler(), Ridge(alpha=5.0)
    ),
    "Lasso (L1 正则化)\n(自带特征选择)": make_pipeline(
        PolynomialFeatures(degree), StandardScaler(), Lasso(alpha=0.2, max_iter=10000)
    ),
}

# 3. 训练并可视化
fig, axes = plt.subplots(2, 3, figsize=(16, 10))

for i, (name, model) in enumerate(models.items()):
    model.fit(X_train, y_train)

    coefs = model[-1].coef_                          # 最后一步回归器的系数
    non_zero_count = np.sum(np.abs(coefs) > 1e-5)    # 非零系数个数

    # 上：拟合曲线
    ax_curve = axes[0, i]
    ax_curve.scatter(X_train, y_train, color='black', s=30, label='训练数据')
    ax_curve.plot(X_plot, X_plot.ravel() ** 2, '--', color='gray', label='真实关系 y=x²')
    ax_curve.plot(X_plot, model.predict(X_plot), color='red', linewidth=2, label='模型预测')
    ax_curve.set_title(name, fontsize=14)
    ax_curve.set_ylim(-5, 15)
    ax_curve.legend()
    ax_curve.grid(True, alpha=0.3)

    # 下：系数分布
    ax_coef = axes[1, i]
    bars = ax_coef.bar(range(len(coefs)), coefs, color='steelblue')
    for bar, coef in zip(bars, coefs):
        if abs(coef) < 1e-5:
            bar.set_color('lightgray')               # 被压到 0 的系数标灰
    ax_coef.set_title(f"模型系数 w_j 分布\n(非零特征数: {non_zero_count} / {len(coefs)})", fontsize=12)
    ax_coef.set_xlabel("多项式特征 (从常数项到 $x^{15}$)")
    ax_coef.set_ylabel("系数值大小")
    ax_coef.axhline(0, color='black', linewidth=0.8)
    ax_coef.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.show()
```

<!-- 图：materials/img0603Regularization.png -->

**拟合曲线表现**

- 普通线性回归：曲线像过山车一样剧烈震荡，试图穿过每一个噪声点，典型过拟合
- Ridge (L2)：曲线变得平滑，不再迎合个别噪声点，基本还原了抛物线
- Lasso (L1)：同样平滑，形状与 Ridge 略有不同，非常接近真实的 \(y = x^2\)

**底层系数表现**

- 普通线性回归：为了制造剧烈震荡，某些系数被推到极端值
- Ridge (L2)：所有极端峰值被压扁，系数大多限制在 \([-3, 3]\)，但全都还在起作用
- Lasso (L1)：大部分系数为 0，只保留了少数关键特征（比如 \(x^2\) 项），其他高次项被直接剔除

## 总结

追求的目标始终是 **泛化能力**：模型在没见过的新数据上依然表现良好。欠拟合和过拟合是阻碍泛化的两大问题：

| 诊断结果 | 主要表现 | 核心问题 | 解决方案 |
|---|---|---|---|
| **欠拟合** | 训练差、测试差 | 表达能力不足 | **做加法**：增加特征（特征工程 / 多项式）、增加训练轮数、换更复杂的模型 |
| **过拟合** | 训练极好、测试差 | 过于敏感、死记硬背 | **做减法**：正则化、更多数据、简化模型（剪枝 / 减少特征）、早停 |

到这里，线性回归的核心知识基本齐了。线性回归是整个机器学习乃至深度学习的 **基本原子**：

- **逻辑回归** 是在线性回归的输出上套一个激活函数
- **深度学习** 是把多个线性变换通过非线性函数层层相连
- **大语言模型** 的核心运算，本质是大规模的矩阵乘法（线性变换）与非线性激活的交替
