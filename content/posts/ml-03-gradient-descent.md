---
title: "机器学习笔记 03 · 梯度下降"
date: 2026-09-24T09:30:00+08:00
draft: false
math: true
tags: ["机器学习", "梯度下降", "优化器", "Adam"]
categories: ["机器学习"]
series: "ml"
seriesOrder: 5
description: "从导数、偏导数到梯度，推导线性回归的梯度公式并手写实现；实验不同学习率的效果；对比 Momentum / AdaGrad / RMSProp / Adam，以及 BGD / SGD / Mini-batch 三种变体。"
summary: "梯度指向函数上升最快的方向，沿反方向按学习率走一步就是梯度下降。手搓实现、学习率实验、优化器演进和小批量变体，这一章一次讲完。"
---

## 本节内容

1. 梯度下降的核心地位
2. 数学原理：导数与偏导数
3. 梯度公式推导
4. 房价预测实例
5. 学习率调优
6. 优化器演进
7. 小批量梯度下降
8. 核心总结

## 模型训练

以简单线性回归为例：

{{< math >}}
\hat{y} = wx + b
{{< /math >}}

- \(w\)：weight，权重 / 斜率
- \(b\)：bias，偏置 / 截距

**训练模型的本质**：搜索最佳的 \(w\) 和 \(b\)。

> **提示**
> 训练闭环：输入数据 → 输出预测 → 计算损失 → 计算梯度 → 更新参数

用损失函数度量预测值 \(\hat{y}\) 与真实值 \(y\) 的偏差，以 MSE 为例：

{{< math >}}
L = MSE = \frac{1}{n} \sum_{i=1}^{n} (\hat{y}_i - y_i)^2
{{< /math >}}

**训练模型的目标**：让损失函数最小，此时得到最佳的 \(w\) 和 \(b\)。

**梯度下降**（Gradient Descent）是一种自动调参的算法，回答的正是「如何调参才能让损失最小」。

## 数学基础

### 导数

**导数**（Derivative）是函数在某点的变化率，说明函数值随自变量变化的趋势。单变量函数 \(f(x)\) 在 \(x_0\) 处的导数定义为：

{{< math >}}
f'(x_0) = \lim_{\Delta x \to 0} \frac{f(x_0 + \Delta x) - f(x_0)}{\Delta x}
{{< /math >}}

<!-- 图：materials/img0301Derivative.png -->

- 几何意义：函数曲线在该点的切线斜率
- \(f'(x_0) > 0\)：\(f\) 在 \(x_0\) 处递增，\(x\) 增大则 \(f(x)\) 增大
- \(f'(x_0) = 0\)：\(f\) 在 \(x_0\) 处取得极值（或驻点）
- \(f'(x_0) < 0\)：\(f\) 在 \(x_0\) 处递减，\(x\) 增大则 \(f(x)\) 减小

### 偏导数

**偏导数**（Partial Derivative）是多变量函数的变化率，说明每个参数对函数值的影响。损失函数通常依赖多个参数，比如 \(L(w, b)\)。求偏导时 **固定其他变量不变，只对其中一个变量求导**。

对于 \(f(x, y) = x^2 + 3xy + y^2\)：

{{< math >}}
\frac{\partial f}{\partial x} = 2x + 3y \quad (\text{把 } y \text{ 当常数}),
\qquad
\frac{\partial f}{\partial y} = 3x + 2y \quad (\text{把 } x \text{ 当常数})
{{< /math >}}

## 核心原理

### 梯度

**梯度**（Gradient）是所有变量的偏导数组成的 **向量**，指向函数值上升最快的方向。

对于线性回归 \(\hat{y} = wx + b\) 的损失 \(L(w, b)\)：

{{< math >}}
\nabla L(w, b) = \left( \frac{\partial L}{\partial w}, \frac{\partial L}{\partial b} \right)
{{< /math >}}

有更多参数 \(\theta_1, \ldots, \theta_d\) 时：

{{< math >}}
\nabla L(\theta) = \left( \frac{\partial L}{\partial \theta_1}, \frac{\partial L}{\partial \theta_2}, \ldots, \frac{\partial L}{\partial \theta_d} \right)
{{< /math >}}

两条重要性质：

1. 梯度的 **方向**，是函数值增长最快的方向
2. 梯度的 **反方向**，是函数值下降最快的方向

### 迭代公式

{{< math >}}
\theta_{new} = \theta_{old} - \eta \, \nabla L(\theta_{old})
\qquad\text{或写作}\qquad
\theta := \theta - \eta \, \nabla L(\theta)
{{< /math >}}

- \(\theta_{old}\)：当前位置
- \(\nabla L(\theta_{old})\)：当前参数处的梯度
- \(\eta\)：学习率（Learning Rate），控制调参幅度
- \(-\eta \nabla L\)：沿梯度反方向，按学习率走一步
- \(:=\)：赋值

**为何减去梯度**：梯度指向函数值增长的方向，要最小化损失就得走反方向。

**为何乘学习率**：控制步幅，避免太大错过最优点，也避免太小浪费时间。

展开到线性回归：

{{< math >}}
w_{new} = w_{old} - \eta \cdot \frac{\partial L}{\partial w},
\qquad
b_{new} = b_{old} - \eta \cdot \frac{\partial L}{\partial b}
{{< /math >}}

## 代码实现

### 问题设置

```python
import numpy as np
import matplotlib.pyplot as plt
plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

np.random.seed(42)   # 随机种子
n_samples = 100      # 样本数量

# 生成随机面积（100 套，90~150 平米）
areas_m2 = np.random.uniform(90, 150, n_samples)

# 转换为「百平米」，缩小 w 和 b 的量纲差异，减少对学习率的影响
areas = areas_m2 / 100

# 生成房价：真实规律 250 × 百平米 + 30，再加噪声
prices = 250 * areas + 30 + np.random.randn(n_samples) * 15

print(f"房屋数量: {len(areas)} 套")
print(f"面积范围: {areas_m2.min():.1f} - {areas_m2.max():.1f} 平米 ({areas.min():.2f} - {areas.max():.2f} 百平米)")
print(f"价格范围: {prices.min():.1f} - {prices.max():.1f} 万")
print("真实规律: 房价 = 2.5 × 面积(平米) + 30")
```

```text
房屋数量: 100 套
面积范围: 90.3 - 149.2 平米 (0.90 - 1.49 百平米)
价格范围: 248.0 - 414.8 万
真实规律: 房价 = 2.5 × 面积(平米) + 30
```

### 推导公式

模型 \(\hat{y} = wx + b\)，损失用 MSE，代入得：

{{< math >}}
L(w, b) = \frac{1}{n} \sum_{i=1}^{n} (w x_i + b - y_i)^2
{{< /math >}}

用链式法则分别对 \(w, b\) 求偏导：

{{< math >}}
\frac{\partial L}{\partial w} = \frac{1}{n} \sum_{i=1}^{n} 2 (w x_i + b - y_i) \cdot x_i,
\qquad
\frac{\partial L}{\partial b} = \frac{1}{n} \sum_{i=1}^{n} 2 (w x_i + b - y_i)
{{< /math >}}

### 手动实现

```python
def gradient_descent(X, y, lr=0.1, epochs=200):
    # 初始化参数
    w, b = 0.0, 0.0
    n = len(X)

    # 记录初始参数和损失
    history = {'w': [w], 'b': [b], 'loss': [np.mean((w * X + b - y) ** 2)]}
    print_step = max(1, epochs // 100)

    for epoch in range(epochs):
        # 当前预测值
        y_pred = w * X + b

        # 梯度
        dw = (2 / n) * np.sum((y_pred - y) * X)
        db = (2 / n) * np.sum(y_pred - y)

        # 更新参数
        w -= lr * dw
        b -= lr * db

        # 记录
        history['w'].append(w)
        history['b'].append(b)
        history['loss'].append(np.mean((w * X + b - y) ** 2))

        # 每隔 1% 的轮数打印一次
        if epoch % print_step == 0:
            print(f"迭代 {epoch:3d}: w={w:.2f}, b={b:.2f}, loss={history['loss'][-1]:.2f}")

    return history

history = gradient_descent(areas, prices, lr=0.01, epochs=100000)
print(f"\n最终结果: 房价 = {history['w'][-1] / 100:.3f} × 面积(平米) + {history['b'][-1]:.2f}")
```

```text
迭代   0: w=7.85, b=6.51, loss=107933.06
...
迭代 10000: w=232.89, b=50.30, loss=182.49
迭代 20000: w=238.09, b=44.07, loss=181.49
迭代 30000: w=238.48, b=43.61, loss=181.48
迭代 40000: w=238.50, b=43.57, loss=181.48
...
迭代 99000: w=238.51, b=43.57, loss=181.48

最终结果: 房价 = 2.385 × 面积(平米) + 43.57
```

学到的 \(w = 238.5, b = 43.6\) 与真实的 \(250, 30\) 有差距，这是噪声加上样本范围较窄（90～150 平米）导致的：在这个区间内，两条线几乎重合。

### 训练过程可视化

跳过前 100 次迭代，避免初始值干扰对收敛过程的观察。

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# 图 1：数据与拟合直线
axes[0].scatter(areas_m2, prices, c='steelblue', s=60, alpha=0.7, label='房屋数据')
x_line = np.linspace(85, 155, 100)
y_line = (history['w'][-1] / 100) * x_line + history['b'][-1]
axes[0].plot(x_line, y_line, 'coral', lw=2,
             label=f'拟合: y={history["w"][-1] / 100:.3f}x+{history["b"][-1]:.1f}')
axes[0].set_xlabel('面积 (平米)', fontsize=12)
axes[0].set_ylabel('房价 (万)', fontsize=12)
axes[0].set_title('房价预测模型', fontsize=14)
axes[0].legend(fontsize=10)
axes[0].grid(True, alpha=0.3)

skip = 100

# 图 2：参数收敛过程
axes[1].axhline(250, color='steelblue', ls='--', alpha=0.5)
axes[1].plot(history['w'][skip:], 'steelblue', lw=2, label='w (目标: 250)')
axes[1].axhline(30, color='darkorange', ls='--', alpha=0.5)
axes[1].plot(history['b'][skip:], 'darkorange', lw=2, label='b (目标: 30)')
axes[1].set_xlabel('迭代次数', fontsize=12)
axes[1].set_ylabel('参数值', fontsize=12)
axes[1].set_title('参数收敛过程', fontsize=14)
axes[1].legend(fontsize=10)
axes[1].grid(True, alpha=0.3)

# 图 3：损失下降
axes[2].plot(history['loss'][skip:], 'orangered', lw=2)
axes[2].set_xlabel('迭代次数', fontsize=12)
axes[2].set_ylabel('损失 (MSE)', fontsize=12)
axes[2].set_title('损失函数下降', fontsize=14)
axes[2].grid(True, alpha=0.3)

plt.tight_layout()
plt.show()
```

<!-- 图：materials/img0302TrainLog.png -->

1. 损失起初迅速下降，随后趋于平缓
2. 参数 \(w\) 从 0 逐步逼近 238
3. 最终的直线较好地拟合了大部分数据点

### 学习率实验

学习率 \(\eta\) 是梯度下降最关键的超参数。用 \(f(x) = x^2\) 做实验：

```python
import numpy as np
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

def gradient_descent(start_x, lr, n_steps=15):
    """在 f(x)=x² 上做梯度下降，返回每步的 x 值"""
    trajectory = [start_x]
    x = start_x
    for _ in range(n_steps):
        grad = 2 * x            # f'(x) = 2x
        x = x - lr * grad       # 参数更新
        trajectory.append(x)
        if abs(x) > 500:        # 已经发散，提前停
            break
    return trajectory

x0 = 4.0
configs = [
    (0.05, '太小：蜗牛爬坡', 'steelblue'),
    (0.3,  '合适：稳步收敛', 'seagreen'),
    (0.9,  '偏大：剧烈震荡', 'orange'),
    (1.1,  '过大：发散',     'crimson'),
]

# 图 1：参数值随迭代变化
fig, axes = plt.subplots(2, 2, figsize=(12, 8))
for ax, (lr, title, color) in zip(axes.flatten(), configs):
    traj = gradient_descent(x0, lr)
    ax.plot(range(len(traj)), traj, 'o-', color=color, markersize=5)
    ax.axhline(y=0, color='gray', linestyle='--', alpha=0.5, label='最优点 x=0')
    ax.set_title(f'lr={lr} — {title}', fontsize=12)
    ax.set_xlabel('迭代次数')
    ax.set_ylabel('参数 x')
    ax.legend()
    ax.grid(True, alpha=0.3)
plt.suptitle('学习率对梯度下降的影响（参数变化）', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()

# 图 2：在损失曲线上可视化轨迹
fig, axes = plt.subplots(2, 2, figsize=(12, 8))
x_curve = np.linspace(-8, 8, 300)
for ax, (lr, title, color) in zip(axes.flatten(), configs):
    traj = gradient_descent(x0, lr, n_steps=10)
    traj_plot = [x for x in traj if abs(x) <= 10]   # 只画不越界的点

    ax.plot(x_curve, x_curve ** 2, 'k-', alpha=0.2, linewidth=2)
    ax.plot(traj_plot, [x ** 2 for x in traj_plot], 'o', color=color, markersize=6)
    for i in range(len(traj_plot) - 1):
        ax.annotate('', xy=(traj_plot[i + 1], traj_plot[i + 1] ** 2),
                    xytext=(traj_plot[i], traj_plot[i] ** 2),
                    arrowprops=dict(arrowstyle='->', color=color, lw=1.5))
    ax.set_title(f'lr={lr} — {title}', fontsize=12)
    ax.set_xlim(-9, 9)
    ax.set_ylim(-5, 70)
    ax.set_xlabel('x')
    ax.set_ylabel('f(x) = x²')
    ax.grid(True, alpha=0.3)
plt.suptitle('学习率对梯度下降的影响（损失曲面轨迹）', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()
```

<!-- 图：materials/img0303ParamChange.png -->
<!-- 图：materials/img0304LossTrajectory.png -->

对于 \(y = x^2\)，梯度是 \(2x\)，更新公式是 \(x := x - lr \cdot 2x = x(1 - 2\,lr)\)。每一步 \(x\) 乘上因子 \((1 - 2\,lr)\)：

1. **lr = 0.05**（因子 0.9）：\(x\) 在右侧坡上慢慢下挪，10 次迭代到不了谷底。学习率太小，收敛极慢
2. **lr = 0.3**（因子 0.4）：顺滑快速到达谷底，没有多余动作
3. **lr = 0.9**（因子 −0.8）：一步跨过谷底到左侧，下一步又跨回右侧，跨幅逐渐变小，呈 Z 字形震荡收敛
4. **lr = 1.1**（因子 −1.2）：在两侧反复横跳，越跳越高，数值指数级增大，直接 **发散**

> **补充**
> 学习率过大导致的发散，口语里也常叫「爆炸」。但严格意义的「梯度爆炸」（gradient explosion）指深度网络反向传播时梯度逐层相乘、数值失控，是另一个问题。两者机制不同，别混在一起。

> **提示**
> 学习率通常需要实验调整，常见起始值有 `1e-2, 1e-3, 1e-4`。也可以配合学习率调度（warmup、余弦衰减）动态调整。

## 优化算法

标准梯度下降的局限：收敛速度慢、容易陷入局部最优或在狭长山谷中震荡。业界发展出一系列改进。

### 动量法 Momentum

基础梯度下降只看当前这一步的坡度，在狭长山谷中容易来回震荡，走出锯齿形路线。

动量法借鉴物理学的惯性：每次更新时把历史更新方向累积为一个「速度」，连续同向则加速，来回变化则相互抵消。像小球从山坡滚下，凭惯性能冲过小坑而不是卡在里面。显著减少震荡、加速收敛，也有助于跳出局部最优。惯性也是双刃剑：动量过大可能冲过最优点。

许多经典图像模型至今仍用 SGD + Momentum 训练。

### 自适应梯度 AdaGrad

动量法解决了方向问题，但所有参数仍共用同一个学习率。现实中有些参数频繁更新，有些很少被触及，一刀切不合理。

AdaGrad 为每个参数维护独立的学习率：累积每个参数的历史梯度平方和，梯度大的参数自动减小步幅，梯度小的保持较大学习率，让稀疏特征也有充分的学习机会。问题是历史梯度只增不减，到训练后期所有学习率都趋近于零，训练可能提前停滞。

适合稀疏数据场景：NLP 中的词向量训练、推荐系统中的大规模稀疏特征。

### 均方根传播 RMSProp

RMSProp 针对 AdaGrad 学习率单调衰减的问题，用指数加权移动平均替代简单累加，让学习率具备「遗忘」能力：只关注近期梯度，不被遥远的历史拖累。

既保留自适应学习率，又避免后期停滞。但它只解决步幅问题，缺少动量机制。适合非平稳目标函数，比如 RNN 的训练。

### 自适应矩估计 Adam

Adam 把动量的方向加速和 RMSProp 的自适应步幅结合起来，同时维护两套信息：一阶矩（梯度均值，即方向趋势）和二阶矩（梯度平方均值，即大小变化）。既快又稳，默认超参数在绝大多数场景直接可用，对学习率的选择相对不敏感。

Adam 几乎适用于所有深度学习任务，是目前的 **默认首选优化器**。大语言模型训练常用它的变体 AdamW（把权重衰减从梯度中解耦）。

### 对比总结

| 算法 | 一句话概括 | 典型场景 |
|---|---|---|
| SGD | 最基础的版本 | 简单问题，或搭配学习率调度 |
| Momentum | 给梯度加上惯性 | 损失面有很多狭长山谷 |
| AdaGrad | 每个参数自动调学习率 | 稀疏数据（如 NLP 词向量） |
| RMSProp | AdaGrad 的改良，学习率不会降到零 | RNN 等非平稳目标 |
| Adam | Momentum + RMSProp，全能选手 | 通用首选，深度学习默认 |

### 手搓 Adam

Adam 的时间步 \(t\) 从 1 开始而非 0，用于偏差校正。

```python
def adam_optimizer(X, y, lr=0.1, epochs=200, beta1=0.9, beta2=0.999, epsilon=1e-8):
    w, b = 0.0, 0.0
    n = len(X)

    # Adam 特有的状态变量：一阶矩 m、二阶矩 v
    m_w, v_w = 0.0, 0.0
    m_b, v_b = 0.0, 0.0

    history = {'w': [w], 'b': [b], 'loss': [np.mean((w * X + b - y) ** 2)]}
    print_step = max(1, epochs // 100)

    for epoch in range(epochs):
        t = epoch + 1   # 时间步从 1 开始

        # 1. 预测
        y_pred = w * X + b

        # 2. 梯度（与普通梯度下降完全一样）
        dw = (2 / n) * np.sum((y_pred - y) * X)
        db = (2 / n) * np.sum(y_pred - y)

        # 3. 一阶矩：动量，累积梯度方向
        m_w = beta1 * m_w + (1 - beta1) * dw
        m_b = beta1 * m_b + (1 - beta1) * db

        # 4. 二阶矩：RMSProp，累积梯度平方
        v_w = beta2 * v_w + (1 - beta2) * (dw ** 2)
        v_b = beta2 * v_b + (1 - beta2) * (db ** 2)

        # 5. 偏差校正：解决初期向 0 偏移的问题
        m_w_hat = m_w / (1 - beta1 ** t)
        m_b_hat = m_b / (1 - beta1 ** t)
        v_w_hat = v_w / (1 - beta2 ** t)
        v_b_hat = v_b / (1 - beta2 ** t)

        # 6. Adam 更新
        w -= lr * m_w_hat / (np.sqrt(v_w_hat) + epsilon)
        b -= lr * m_b_hat / (np.sqrt(v_b_hat) + epsilon)

        current_loss = np.mean((w * X + b - y) ** 2)
        history['w'].append(w)
        history['b'].append(b)
        history['loss'].append(current_loss)

        if epoch % print_step == 0:
            print(f"迭代 {epoch:5d}: w={w:.4f}, b={b:.4f}, loss={current_loss:.4f}")

    return history

history = adam_optimizer(areas, prices, lr=0.1, epochs=50000)
print(f"\n最终结果: 房价 = {history['w'][-1] / 100:.3f} × 面积(平米) + {history['b'][-1]:.2f}")
```

<!-- 图：materials/img0305AdamTrainLog.png -->

对比前面的普通梯度下降，Adam 收敛明显更快：普通梯度下降在 2 万轮之后才收敛，Adam 在 2 万轮之前就已收敛。

## 梯度下降的变体

每次更新参数要用多少数据来算梯度？

| 维度 | BGD（全量） | Mini-batch | SGD（单样本） |
|---|---|---|---|
| 每步计算量 | 大 | 适中 | 小 |
| 梯度准确度 | 精确 | 近似 | 噪声大 |
| 收敛稳定性 | 很稳定 | 较稳定 | 震荡剧烈 |
| 能否利用 GPU 并行 | 能 | 能且最佳 | 否 |
| 实际使用 | 小数据集 | **主流选择** | 很少单独使用 |

> **提示**
> Mini-batch 是深度学习训练的主流选择。

> **注意**
> 实际语境里「SGD」常常指的是小批量梯度下降（batch 64 / 128），而不是严格的单样本。

### 批量梯度下降 BGD

**批量梯度下降**（Batch Gradient Descent）每次用全部训练数据计算梯度，然后更新一次参数，前面的手写实现就是这种。梯度最准确，更新方向最稳定，对凸函数（学习率合适时）一定能收敛到最优解。

代价高昂：数据量很大时（100 万条），每走一步都要遍历整个数据集；也无法在线学习，必须拿到所有数据才能开始。

### 随机梯度下降 SGD

**随机梯度下降**（Stochastic Gradient Descent）走向另一个极端：每次只用一条随机抽取的数据计算梯度，立刻更新参数。每步极其轻量，天然的随机性有助于跳出局部最优，支持在线学习。

但单条数据估计的梯度噪声很大，收敛过程剧烈震荡，整体效率反而可能受损。

### 小批量梯度下降 Mini-batch

**小批量梯度下降**（Mini-batch Gradient Descent）是两者的折中：每次随机抽取一个小批量（通常 32、64、128 或 256 条）计算梯度并更新。既保留了梯度估计相对准确、方向相对稳定的优势，又兼顾了计算高效和一定随机性。

## 深度学习的基础

传统机器学习、深度学习、大语言模型的训练和优化，都依赖梯度下降。**梯度下降是深度学习模型的底层逻辑。**

### 反向传播

深度神经网络可能有百万级甚至千亿级参数。训练依赖三步：

1. **前向传播**（Forward Propagation）：输入数据从输入层逐层经过隐藏层，得到输出和损失
2. **反向传播**（Back Propagation）：从损失函数出发，用链式法则逐层计算每个参数的梯度
3. **梯度下降**（Gradient Descent）：用算出的梯度更新所有参数

> **提示**
> 深度学习训练 = 反向传播（算梯度） + 梯度下降（更新参数）

### 大语言模型

从简单的线性回归到今天的大语言模型，机器学习的基本范式从未改变：

1. 用数据寻找规律
2. 用模型表达规律
3. 用损失函数衡量误差
4. 用梯度下降优化参数
5. 不断迭代更新模型

LLM 的训练过程与线性回归的梯度下降基本一致，只是规模不同：

- 模型架构复杂（Transformer）
- 参数规模庞大（千亿级）
- 数据规模庞大（全互联网）
- 损失函数不同（交叉熵）
- 优化器更先进（AdamW）

**核心思路一致**：沿着梯度反方向更新参数，让损失函数最小。
