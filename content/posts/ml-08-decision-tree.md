---
title: "机器学习笔记 08 · 决策树"
date: 2026-09-24T10:20:00+08:00
draft: false
math: true
tags: ["机器学习", "决策树", "信息增益", "基尼系数", "剪枝"]
categories: ["机器学习"]
series: "ml"
seriesOrder: 10
description: "决策树用一连串「如果…那么…」把数据切开。从天气打球的例子理解纯度，用熵、信息增益和基尼系数选分裂特征，鸢尾花案例可视化建树，最后讨论剪枝和集成学习的出口。"
summary: "每次分裂都让子集更纯。熵和基尼系数是两把尺子，CART 用基尼；单棵树不稳定，所以有了随机森林和 GBDT。"
---

## 本节内容

1. 直观分类算法
2. 决策树结构与术语
3. 构建决策树：纯度概念
4. 分裂准则：熵与信息增益
5. 基尼系数与 CART 算法
6. 递归构建决策树过程
7. 鸢尾花分类案例
8. 过拟合与剪枝策略
9. 决策树优缺点总结
10. 集成学习

## 天气决策打球

特征：

1. 天气：晴天 / 多云 / 下雨
2. 温度：炎热 / 温和 / 凉爽
3. 湿度：高 / 正常
4. 刮风：是 / 否

| Outlook | Temperature | Humidity | Windy | Play |
|---|---|---|---|---|
| Sunny | Hot | High | False | No |
| Sunny | Mild | High | False | No |
| Overcast | Hot | High | True | Yes |
| Overcast | Mild | Normal | False | Yes |
| Rain | Mild | High | False | Yes |
| Rain | Cool | Normal | False | Yes |
| Sunny | Cool | Normal | False | Yes |
| Sunny | Mild | High | True | No |
| Rain | Mild | High | True | No |
| Overcast | Cool | Normal | True | Yes |

决策树的核心思想：通过一系列「如果…那么…」的判断，逐步得出结论。

<!-- 图：materials/img0801DecisionTree.svg -->

## 决策树

**决策树**（Decision Tree）是一种模仿人类决策时层层提问方式的机器学习算法。将数据按照不同特征递归分裂，最终形成倒立的树状决策结构：

1. **内部节点**：代表对某个特征的判断
2. **分支**：代表判断后的不同结果
3. **叶节点**：代表最终的决策结果

它是经典监督学习算法，既能解决分类问题，也能用于回归任务。决策路径透明，是机器学习中最具可解释性的模型之一。

## 构建决策树

### 节点纯度

构建过程的关键问题是：如何从众多特征中挑选用来分裂的特征。

**构建决策树的终极目标，就是每一次分裂后，都能让分出来的子集纯度（Purity）尽可能地高**，直到所有叶节点都变成 100% 纯净，树就建好了。

1. 按「温度」分组，纯度低：Hot / Mild / Cool 各组中，Yes 和 No 混杂

   | Temp | Play |
   |---|---|
   | Hot | No, Yes |
   | Mild | Yes, Yes, No, No, Yes |
   | Cool | Yes, Yes, Yes |

2. 按「天气」分组，纯度高：多云分组所有标签都是 Yes，这个节点的纯度极高

   | Outlook | Play |
   |---|---|
   | Sunny | No, No, Yes, No |
   | Overcast | Yes, Yes, Yes |
   | Rain | Yes, Yes, No |

### 纯度度量

#### 熵 Entropy

概念来自物理和信息论，描述系统的混乱程度。在决策树中，用来衡量一个节点中各类别分布的混乱程度：

- 一个节点里一半去打球、一半不去（50% vs 50%），悬念最大，熵值最高，最混乱
- 一个节点里全部去或全部不去（100% vs 0%），毫无悬念，熵值为 0，最纯净

{{< math >}}
H(D) = -\sum_{k=1}^{K} p_k \log_2 p_k
{{< /math >}}

- \(p_k\)：第 \(k\) 类样本在节点 \(D\) 中的占比
- 二分类时，\(p = 0.5\) 处 \(H = 1\)（最大），\(p = 0\) 或 \(1\) 处 \(H = 0\)

熵越高，节点越不纯，越需要通过分裂降低混乱程度。

#### 信息增益 Information Gain

仅知道一个节点的混乱程度还不够，更关心用某个特征分裂之后，混乱程度下降了多少：

{{< math >}}
\text{信息增益} = \text{分裂前的熵} - \text{分裂后各子节点的加权平均熵}
{{< /math >}}

{{< math >}}
IG(D, A) = H(D) - \sum_{v} \frac{|D_v|}{|D|} H(D_v)
{{< /math >}}

用这个特征提问后，消除了多少不确定性。信息增益越大，特征的区分能力越强。在打球的例子里，「天气」通常会获得最高的信息增益，因此被选为根节点。

> **补充**
> 信息增益偏爱取值多的特征（比如「日期」可以把每条样本分成一个纯节点，增益最大却毫无用处）。**ID3** 算法用信息增益；**C4.5** 改用 **信息增益率**（增益除以该特征自身的熵）来抵消这种偏好；**CART** 用下面的基尼系数，且只做二叉分裂，同时支持回归（用 MSE 作分裂准则）。sklearn 实现的是 CART。

#### 基尼系数 Gini

基尼系数：从当前节点中随机抽取两个样本，它们属于不同类别的概率。亦称 **基尼不纯度**（Gini Impurity），和熵的物理意义类似，都能衡量数据的混乱程度。熵需要对数运算，基尼系数只需乘法和加法，业界倾向使用基尼不纯度。

- 基尼系数越小，节点越纯（系数为 0 时完全纯净），大多数样本属于同一类别
- 基尼系数越大，节点越乱，各类别分布越均匀

{{< math >}}
\begin{aligned}
Gini(D) &= 1 - \sum_{k=1}^{K} p_k^2 \\
&= \sum_{k=1}^{K} p_k (1 - p_k)
\end{aligned}
{{< /math >}}

- \(D\)：当前节点的数据集
- \(K\)：类别总数
- \(p_k\)：第 \(k\) 类样本在 \(D\) 中的占比

在 `scikit-learn` 等主流库中，CART 算法决策树 `DecisionTreeClassifier` 默认使用基尼系数。

## 决策树的生长

构建决策树是一个递归流程：

1. **计算指标**：计算当前节点用各项特征划分后子节点的（加权）基尼系数
2. **选择最优**：选择划分后基尼系数最小（即纯度提升最大）的特征，作为当前节点的分裂特征
3. **分裂数据**：按照该特征的取值（连续特征则按阈值），将当前数据分裂成若干子节点
4. **递归生长**：对每个子节点重复上述过程，让决策树继续向下生长
5. **生成叶节点**：满足停止条件时停止分裂，将当前节点设为叶节点，并确定最终的预测结果

如此反复递归，直到所有分支都变为纯净的叶节点，或者已经没有可用的特征可以继续分裂，一棵完整的决策树就构建完成了。

## 鸢尾花案例

### 加载数据

使用 `scikit-learn` 自带的鸢尾花（Iris）数据集：150 个样本、4 个特征、3 个标签。

```python
import pandas as pd
from sklearn.datasets import load_iris

# 1. 加载数据集
iris = load_iris()

# 2. 为了方便阅读，将英文特征名和类别名翻译成中文
feature_names_cn = ['花萼长度(cm)', '花萼宽度(cm)', '花瓣长度(cm)', '花瓣宽度(cm)']
target_names_cn = ['山鸢尾', '变色鸢尾', '维吉尼亚鸢尾']

# 3. 转换成 DataFrame 展示
df = pd.DataFrame(iris.data, columns=feature_names_cn)
df['最终分类结果'] = [target_names_cn[i] for i in iris.target]

print("========== 1. 数据集前5行预览 ==========")
print(df.head())

print("\n========== 2. 数据集包含的分类及数量 ==========")
print(df['最终分类结果'].value_counts())
```

### 基尼建树绘图

```python
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score
from sklearn import tree
import matplotlib.pyplot as plt

# --- 中文支持 ---
plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS', 'Songti SC']
plt.rcParams['axes.unicode_minus'] = False

# ================= 1. 划分数据 =================
X = iris.data      # 4 个特征
y = iris.target    # 答案标签
# 留出 30% 作为测试集，70% 用来训练
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# ================= 2. 构建与训练模型 =================
# criterion='gini' : 使用基尼系数
# max_depth=3      : 树最多往下长 3 层（停止条件）
clf = DecisionTreeClassifier(criterion='gini', max_depth=3, random_state=42)

# 开始建树（算基尼系数 -> 选特征 -> 分裂 -> 递归）
clf.fit(X_train, y_train)

# ================= 3. 预测成绩 =================
y_pred = clf.predict(X_test)
print(f"决策树模型的预测准确率为: {accuracy_score(y_test, y_pred) * 100:.2f}%\n")

# ================= 4. 画出这棵树 =================
plt.figure(figsize=(16, 12))
tree.plot_tree(clf,
               feature_names=feature_names_cn,
               class_names=target_names_cn,
               filled=True,    # 涂色：基尼系数越小，颜色越深
               rounded=True)
plt.show()
```

<!-- 图：materials/img0802TreePlot.png -->

节点信息解读：

- `samples`：该节点包含的总样本数
- `value`：各类别的样本分布
- `gini`：基尼不纯度，衡量该节点的混乱程度
- `class`：该节点的默认类别，即节点里数量最多的类别
- 节点着色越深，代表纯度越高（gini 越接近 0）

可视化模型通过 **花瓣长度** 和 **花瓣宽度** 逐步区分三种鸢尾花：

<table>
  <tr>
    <th>鸢尾花类别</th>
    <th>关键阈值</th>
    <th>节点纯度</th>
  </tr>
  <tr>
    <td>山鸢尾</td>
    <td>花瓣长度 ≤ 2.45</td>
    <td>完全纯净 (gini = 0)</td>
  </tr>
  <tr>
    <td rowspan="2">变色鸢尾</td>
    <td>2.45 &lt; 花瓣长度 ≤ 4.75 且 花瓣宽度 ≤ 1.6</td>
    <td>完全纯净 (gini = 0)</td>
  </tr>
  <tr>
    <td>花瓣长度 &gt; 4.75 且 1.6 &lt; 花瓣宽度 ≤ 1.75</td>
    <td>混合较多 (gini = 0.5)</td>
  </tr>
  <tr>
    <td rowspan="2">维吉尼亚鸢尾</td>
    <td>2.45 &lt; 花瓣长度 ≤ 4.75 且 花瓣宽度 &gt; 1.6</td>
    <td>完全纯净 (gini = 0)</td>
  </tr>
  <tr>
    <td>花瓣长度 &gt; 4.75 且 花瓣宽度 &gt; 1.75</td>
    <td>整体纯净 (gini ≈ 0.06，含少量杂质)</td>
  </tr>
</table>

结论：**花瓣长度和宽度决定了种类**

- 花瓣越短 → 越可能是山鸢尾
- 花瓣中等 → 多为变色鸢尾
- 花瓣最长 → 多为维吉尼亚鸢尾
- 花瓣长度 > 4.75 且 1.6 < 宽度 ≤ 1.75 时，变色鸢尾与维吉尼亚鸢尾有重叠

> **注意**
> 具体阈值与 `random_state` 及划分方式有关，换一个种子得到的树会略有差别。这正是下一节要讲的「单棵树不稳定」。

### 剪枝防止过拟合

任由决策树生长，它会为异常值单独建立分支，最终过拟合。需要剪除多余分支，保留核心主干，即 **剪枝**（Pruning）。

1. **预剪枝 Pre-pruning**：提前设定规则，生长中触发规则时强制停止分裂
   - 限制最大深度 `max_depth=3`：长到第 3 层就停下，即使基尼系数还未降至 0
   - 限制叶节点最少样本数 `min_samples_leaf`：如果子节点只剩 2 个样本，继续分裂将失去普遍代表性，不如停止
   - 其他：`min_samples_split`、`max_leaf_nodes`、`min_impurity_decrease`
2. **后剪枝 Post-pruning**：先让树毫无保留地生长到最大，再从下往上检查。若剪掉某个底部分支不会导致准确率明显下降，甚至能提高验证集表现，就剪掉。sklearn 里对应 `ccp_alpha`（代价复杂度剪枝）。

实际工程中预剪枝实现简单、计算量小，被广泛使用；后剪枝理论效果更好，但在大数据场景下计算成本较高。

## 决策树优劣

优点：

1. 直观易解释，可视化效果好
2. 能处理非线性关系，既能回归也能分类
3. 对量纲不敏感，预处理要求低：自主挑选分裂特征、自主计算分裂阈值

缺点：

1. 单棵决策树的稳定性差：数据微小变动可能让树结构大变
2. 对噪声敏感，容易过拟合

## 集成学习

**集成学习**（Ensemble Learning）：由多棵决策树构成的森林，能弥补单棵树稳定性差的缺点。以决策树为基础，繁衍出工业界和算法竞赛中最主流的顶级算法：

- **随机森林 Random Forest**：构建很多棵相互独立的决策树。每次建树只随机抽取部分数据和部分特征。预测时让所有树独立预测，然后投票表决、少数服从多数。极大降低了单棵树过拟合带来的误判风险
- **梯度提升树家族**：也由多棵决策树组合，但树与树之间不再独立，而是 **按序累加**。若第一棵树的预测有误差，第二棵树专门针对这个误差进行纠正，通过迭代不断提升精度
  1. GBDT
  2. XGBoost
  3. LightGBM
