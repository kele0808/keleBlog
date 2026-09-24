---
title: "机器学习笔记 09 · 随机森林"
date: 2026-09-24T10:30:00+08:00
draft: false
math: true
tags: ["机器学习", "随机森林", "集成学习", "Bagging", "特征重要性"]
categories: ["机器学习"]
series: "ml"
seriesOrder: 11
description: "随机森林 = 很多棵不一样的决策树投票。样本随机（Bootstrap）+ 特征随机制造多样性，袋外样本提供免费验证集，MDI 与排列重要性两种方式解读特征贡献。"
summary: "个体不必完美，多样性构建稳定。约 36.8% 的样本抽不到，正好拿来当验证集。"
---

## 本节内容

1. 决策树的优劣
2. 随机森林原理
3. 双随机性详解
4. OOB 样本价值
5. 构建步骤
6. 代码实现
7. 特征重要性分析
8. 总结

## 决策树的优劣

- 优势：极佳的可解释性
- 劣势：天然的脆弱性，对噪音敏感、容易过拟合

Leo Breiman 于 2001 年提出 **随机森林**，以处理决策树不稳定的问题。

## 集成学习

**集成学习**（Ensemble Learning）：将多个弱学习器组合成一个强学习器，以取得比单一模型更好的泛化性能。三个臭皮匠顶个诸葛亮。

随机森林属于集成学习，是「专家会诊」模式：不再依赖单棵树决策，而是通过 **随机采样** 建立多棵不同的决策树。预测时让所有树独立判断，最终汇总结果（分类投票 / 回归求平均），有效中和单棵树的偏见与错误，使模型 **既准确又稳健**。

## 随机森林

- **森林 Forest**：由多棵决策树组成。决策树是基础模型，通过一系列 if-then 规则对数据逐层切分
- **随机 Random**：算法的灵魂。为了森林的多样性，引入 **双重随机性**，对数据和特征随机抽样

1. **样本随机 Bootstrap**：采用 **有放回抽样**（resample），每棵树看到的训练集略有不同
2. **特征随机 Random Subspace**：决策树在每个节点分裂时，不考虑全部特征，而是随机抽取其中一个子集，仅在这些候选特征中寻找最优分裂点。分类任务通常取 \(\sqrt{d}\) 个（\(d\) 为总特征数，sklearn 的 `max_features='sqrt'`）；回归任务 sklearn 默认用全部特征，经验上也常取 \(d/3\)

如果特征抽取不随机，所有树都会优先选最强的特征作为根节点，导致结构高度相似。加入特征随机后，部分树被迫挑选其他特征分裂，形成不同视角。

**个体不必完美，多样性构建稳定。**

> **补充**
> 集成的收益来自「多样性」：如果所有树犯一样的错，投票没有意义。用统计语言说，平均 \(T\) 个方差为 \(\sigma^2\)、两两相关系数为 \(\rho\) 的预测，方差是 \(\rho\sigma^2 + \frac{1-\rho}{T}\sigma^2\)。特征随机就是在压低 \(\rho\)。

## 袋外估计

**袋外样本**（Out of Bag, OOB）提供了免费的验证集。

每次 Bootstrap 采样，某个样本在 \(N\) 次抽取中始终未被选中的概率为：

{{< math >}}
P(\text{未被抽中}) = \left(1 - \frac{1}{N}\right)^N \xrightarrow{N \to \infty} \frac{1}{e} \approx 36.8\%
{{< /math >}}

每棵树约有 1/3 的样本未参与训练，称为袋外样本。用「没见过该样本」的那些树对它做预测，汇总就是 OOB 估计。

**零浪费机制，训练与验证无缝融合**：天然的验证集，省去额外划分验证集和交叉验证的繁琐；所有数据都能直接投入训练并同步支持超参数调优，在小数据集场景下尤为珍贵。

## 构建步骤

1. **构建专家团**：设定森林中树的数量 `n_estimators`，常为 100～500
2. **逐棵生成决策树**：对于第 \(t\) 棵树（\(t = 1, 2, \ldots, T\)）
   1. 通过 Bootstrap 有放回抽取 \(N\) 个样本作为训练集
   2. 每个节点分裂时，随机选取 \(m\) 个候选特征，在其中找最佳切分点
   3. 让树充分生长，通常不剪枝，或设置较大的 `max_depth`
3. **集成输出**：所有树训练完成后，对新样本 \(x\) 进行预测
   - 分类任务采用 **多数表决**（Majority Voting）

     {{< math >}}
     \hat{y} = \arg\max_{c} \sum_{t=1}^{T} \mathbb{I}\big[h_t(x) = c\big]
     {{< /math >}}

     - \(h_t(x)\)：第 \(t\) 个基学习器对输入 \(x\) 的预测标签
     - \(\mathbb{I}[\cdot]\)：指示函数，条件为真取 1，否则取 0
     - \(\arg\max_c\)：在所有类别中找到得票最多的类别 \(c\)
     - sklearn 实际上是对各树输出的类别概率取平均（软投票），再取最大

   - 回归任务采用 **简单平均**（Averaging）

     {{< math >}}
     \hat{y} = \frac{1}{T} \sum_{t=1}^{T} h_t(x)
     {{< /math >}}

## 代码实现

用 100 棵决策树组成随机森林，在鸢尾花数据集上训练、验证：

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# 加载数据
X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 构建随机森林
rf = RandomForestClassifier(
    n_estimators=100,     # 树的数量
    max_features='sqrt',  # 每次分裂时随机选取的特征数
    oob_score=True,       # 启用 OOB 估计
    random_state=42,
    n_jobs=-1             # 并行训练
)

rf.fit(X_train, y_train)

# 评估
print(f"OOB 准确率: {rf.oob_score_:.4f}")
print(f"测试集准确率: {accuracy_score(y_test, rf.predict(X_test)):.4f}")
```

- OOB 准确率 0.9429
- 测试集准确率 1.0000

模型仅利用训练过程中产生的袋外数据，就得到 94% 的准确率估计。测试集上 100% 有一部分是运气：鸢尾花数据量小（45 个测试样本），本身也很容易分。

## 特征重要性

业界最常用的能力之一：理解哪些特征在起作用，哪些可以舍弃。两种计量特征重要性的方法：

1. **基于不纯度减少的重要性 MDI**（Mean Decrease in Impurity）：统计每个特征在所有树的所有节点上带来的不纯度（如基尼系数）下降量之和，再求平均。是 `sklearn` 的 `feature_importances_`，训练时即可得到、速度快。但会偏好 **高基数特征**，比如 ID 列对预测毫无意义，却可能得到很高的 MDI 评价
2. **基于排列的重要性 Permutation Importance**：将某个特征的取值随机打乱，观察模型性能下降程度。下降越多，重要性越强。**更可靠，不受基数影响**，且应在测试集 / 验证集上计算

```python
import matplotlib.pyplot as plt
from sklearn.inspection import permutation_importance

# 基于不纯度的重要性
feat_names = load_iris().feature_names
importances = rf.feature_importances_

# 基于排列的重要性（在测试集上计算）
perm_imp = permutation_importance(rf, X_test, y_test, n_repeats=30, random_state=42)

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

axes[0].barh(feat_names, importances)
axes[0].set_title('MDI Feature Importance')

axes[1].barh(feat_names, perm_imp.importances_mean)
axes[1].set_title('Permutation Feature Importance')

plt.tight_layout()
plt.show()
```

<!-- 图：materials/img0901FeatureImportance.png -->

> **补充**
> 当两个特征高度相关时（鸢尾花的花瓣长与花瓣宽），排列重要性会被「分摊」：打乱其中一个，模型还能从另一个获得信息，两者都显得不重要。解读时要结合相关性一起看。

## 总结优劣

随机森林引入 **「样本随机 + 特征随机」** 双重随机性制造多样性，再用 **集体投票** 消除个体偏差。未必是精度最高的模型，但是值得首先尝试的模型。

优点：

1. **抗过拟合能力强**：极大降低模型的方差
2. **极简的数据预处理**：无需归一化，对异常值不敏感（sklearn ≥ 1.4 的树模型也支持缺失值）
3. **对高维数据友好**：从容应对大量特征，无需显式降维
4. **附带特征重要性**：自然输出特征贡献度，利于业务归因
5. **支持并行计算**：树的生成完全独立，充分利用多核 CPU

缺点：

1. **黑盒模型**：单棵树可解释性强，但多棵树双随机后失去直观性
2. **计算与内存开销大**：保存大量树结构需要较多内存；预测时每条数据要经过所有树，不适合低延迟场景
3. **对极端噪音敏感**：噪音极大的分类任务中，仍可能过拟合

## 梯度提升树家族

随机森林靠「并行 + 平均」降方差；梯度提升树靠「串行 + 纠错」降偏差，好比 **站在巨人的肩膀上**：

1. XGBoost
2. LightGBM
3. CatBoost

下一篇展开。
