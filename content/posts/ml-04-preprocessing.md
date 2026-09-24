---
title: "机器学习笔记 04 · 数据预处理"
date: 2026-09-24T09:40:00+08:00
draft: false
math: true
tags: ["机器学习", "数据预处理", "特征工程", "Pandas", "scikit-learn"]
categories: ["机器学习"]
series: "ml"
seriesOrder: 6
description: "以 Titanic 数据集为例走一遍预处理全流程：先划分再预处理、EDA、缺失值与异常值处理、序数 / 独热 / 标签三种编码、特征构造、标准化与归一化，最后用 Pipeline 封装。"
summary: "Garbage in, garbage out。数据预处理决定模型上限：防泄漏、EDA 驱动、Pipeline 封装，这三条原则贯穿全章。"
---

## 本节内容

1. 数据预处理的重要性
2. 工具与数据准备
3. 数据划分与防泄漏
4. EDA：数据探索分析
5. 数据清洗：缺失值处理
6. 异常值检测与处理
7. 特征编码方法
8. 特征构造与删除
9. 特征缩放方法
10. 流程封装与总结

## 预处理的意义

> **注意**
> "Garbage In, Garbage Out." 垃圾进，垃圾出。

现实世界的数据常有这些问题：

1. 缺失值或异常值
2. 非数值类型的数据（文本、类别）
3. 量纲差异巨大

## 常用工具

`Pandas`、`Matplotlib`、`Seaborn`、`Scikit-learn (sklearn)`。

## 准备环境与数据

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_style("whitegrid")
plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# 从网络读取泰坦尼克号数据集
url = 'https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv'
df = pd.read_csv(url)

print("数据集形状:", df.shape)
print("\n前5行数据:")
display(df.head())          # Jupyter 环境下用 display，脚本里换成 print

print("\n数据类型与缺失值情况:")
print(df.info())
```

这个版本的列名是首字母大写的：`PassengerId, Survived, Pclass, Name, Sex, Age, SibSp, Parch, Ticket, Fare, Cabin, Embarked`。后文代码统一用这套列名。

## 数据集划分

**先划分数据集，再做预处理。** 数据集分为三部分：

| 数据集 | 占比 | 用途 |
|---|---|---|
| 训练集 | 60%～80% | 训练模型，学习数据中的规律 |
| 验证集 | 10%～20% | 调整超参数，评估模型在陌生数据上的表现 |
| 测试集 | 10%～20% | 模拟真实世界数据，最终评估泛化能力 |

> **注意**
> **防止数据泄露（Data Leakage）原则**
> 所有 `fit` 操作只在训练集内进行，测试集只做 `transform`。

```python
from sklearn.model_selection import train_test_split

# 特征 X 与目标标签 y (Survived)
X = df.drop('Survived', axis=1)
y = df['Survived']

# 80% 训练，20% 测试
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,   # 固定随机种子，保证可复现
    stratify=y         # 分层抽样，保持正负样本比例一致
)

print(f"训练集: {X_train.shape[0]} 样本")   # 712
print(f"测试集: {X_test.shape[0]} 样本")    # 179
print(f"\n训练集存活率: {y_train.mean():.2%}")   # ≈38.34%
print(f"测试集存活率: {y_test.mean():.2%}")     # ≈38.55%
```

> stratify，分层。设置 `stratify=y` 后，sklearn 会保证两个子集里正负样本比例与原始数据一致。

接下来所有探索和规则制定（EDA、计算均值等）必须只在 `X_train` 上进行。

## 数据探索分析 EDA

**数据探索分析**（Exploratory Data Analysis）类似给数据做全面体检：通过统计指标和可视化，直观发现数据的问题和规律，为后续预处理提供依据。

### 基本信息

```python
# 数据类型和缺失情况
X_train.info()

# 缺失值统计
missing = X_train.isnull().sum()
missing_pct = (missing / len(X_train) * 100).round(1)
pd.DataFrame({"缺失数": missing, "缺失率%": missing_pct}).query("缺失数 > 0")
```

### 数值特征统计

```python
X_train.describe()
```

注意 `Fare` 最大 512、最小 0，量纲差异巨大，后面需要缩放。

### 数据可视化

```python
fig, axes = plt.subplots(2, 3, figsize=(15, 10))

# 1. 存活率分布
y_train.value_counts().plot.bar(ax=axes[0, 0], color=['#e74c3c', '#2ecc71'])
axes[0, 0].set_title('存活率分布')
axes[0, 0].set_xticklabels(['Dead (0)', 'Survived (1)'], rotation=0)

# 2. 年龄分布
X_train['Age'].hist(bins=30, ax=axes[0, 1], color='steelblue', edgecolor='black')
axes[0, 1].set_title('年龄分布')

# 3. 票价分布
X_train['Fare'].hist(bins=30, ax=axes[0, 2], color='coral', edgecolor='black')
axes[0, 2].set_title('票价分布')

# 4. 性别 vs 存活
train_data = X_train.copy()
train_data['Survived'] = y_train
sns.barplot(x='Sex', y='Survived', data=train_data, ax=axes[1, 0])
axes[1, 0].set_title('性别 vs 存活')

# 5. 船票等级 vs 存活
sns.barplot(x='Pclass', y='Survived', data=train_data, ax=axes[1, 1])
axes[1, 1].set_title('船票等级 vs 存活')

# 6. 相关性热力图
numeric_cols = train_data[['Survived', 'Pclass', 'Age', 'SibSp', 'Parch', 'Fare']]
sns.heatmap(numeric_cols.corr(), annot=True, cmap='RdBu_r', center=0, ax=axes[1, 2])
axes[1, 2].set_title('相关性热力图')

plt.tight_layout()
plt.show()
```

<!-- 图：materials/img0401EDA.png -->

### EDA 关键发现

| 发现 | 处理 |
|---|---|
| 女性存活率远高于男性（~74% vs ~19%） | Sex 是强特征，需编码为数值 |
| 一等舱存活率最高（~63%） | Pclass 是强特征，保留或独热编码 |
| Age 缺失约 20% | 需要填充；分布略偏态，选中位数 |
| Cabin 缺失 77% | 直接填充意义不大，转化为「有 / 无客舱信息」 |
| Fare 严重右偏（均值 > 中位数，长尾） | 可能需要对数变换或截断 |
| PassengerId、Name、Ticket 对预测无直接帮助 | 删除，或从 Name 中提取头衔 |

## 数据清洗

数据清洗通常涵盖：剔除重复值、填补缺失值、处理异常值。

### 处理重复值

```python
duplicates = X_train.duplicated().sum()
print(f"重复行数: {duplicates}")

if duplicates > 0:
    X_train = X_train.drop_duplicates()
    y_train = y_train.loc[X_train.index]   # 保持 y 与 X 同步
```

`X_train` 和 `y_train` 靠索引对齐。从 `X_train` 删掉某行，`y_train` 也要删对应的行。

### 处理缺失值

策略按缺失比例和特征类型灵活选择。

**按缺失比例决定删除策略**（经验规则，不是铁律）

1. 缺失极低（< 5%）且为随机缺失 → 直接删除对应样本行
2. 缺失极高（> 70%） → 特征信息量匮乏，通常删除整列，或像 Cabin 这样转成「是否缺失」

**按特征类型选择填充方法**

1. **数值型**：均值或中位数。均值适用于近正态、无异常值的场景；中位数对极端值不敏感，在偏态或有异常值时更稳健
2. **类别型**：众数，或新增 `"Unknown"` 类别。众数适合低缺失率；`"Unknown"` 能保留「缺失本身可能蕴含的业务信息」

`sklearn` 的 `SimpleImputer` 专门处理缺失值：

1. 初始化时设定 `strategy`
2. 在训练集上 `.fit()`，算出均值 / 中位数 / 众数并保存
3. 在测试集 / 新数据上 `.transform()`，用保存的值填充

```python
from sklearn.impute import SimpleImputer

# Age: 中位数填充（分布略偏态）
age_imputer = SimpleImputer(strategy='median')
age_imputer.fit(X_train[['Age']])      # fit 只用训练集
print(f"训练集 Age 中位数: {age_imputer.statistics_[0]}")   # 28.0

X_train['Age'] = age_imputer.transform(X_train[['Age']]).ravel()
X_test['Age']  = age_imputer.transform(X_test[['Age']]).ravel()   # 用训练集的中位数

# Embarked: 众数填充（只缺 2 个）
embarked_imputer = SimpleImputer(strategy='most_frequent')
embarked_imputer.fit(X_train[['Embarked']])
print(f"训练集 Embarked 众数: {embarked_imputer.statistics_[0]}")   # 'S'

X_train['Embarked'] = embarked_imputer.transform(X_train[['Embarked']]).ravel()
X_test['Embarked']  = embarked_imputer.transform(X_test[['Embarked']]).ravel()

# Cabin: 缺失 77%，转为「有无客舱信息」，再删原列
X_train['HasCabin'] = X_train['Cabin'].notna().astype(int)
X_test['HasCabin']  = X_test['Cabin'].notna().astype(int)
X_train.drop(columns=['Cabin'], inplace=True)
X_test.drop(columns=['Cabin'], inplace=True)

print("\n处理后缺失值:")
print(X_train.isnull().sum())
```

### 处理异常值

**异常值**（Outliers）是显著偏离其他观测值的极端值，可能来自测量误差、录入错误，也可能是真实的极端情况。可以用 **箱线图** 检测：

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 4))
for i, col in enumerate(['Age', 'Fare', 'SibSp']):
    X_train.boxplot(column=col, ax=axes[i])
    axes[i].set_title(f'{col} Boxplot')
plt.tight_layout()
plt.show()
```

<!-- 图：materials/img0402Boxplot.png -->

1. **Age**：大部分乘客集中在 20～40 岁（箱体），60～80 岁有不少离群点。这是真实存在的高龄乘客，不是数据错误
2. **Fare**：**极度右偏**。绝大多数票价很低（箱体被压在 0～50），少数超过 500，可能是头等舱。极端值会让模型过度关注这几个高价乘客，需要处理（取对数、分箱或截断）
3. **SibSp**：大部分是 0 或 1，也有带 3、4、5 甚至 8 个亲属的大家庭，也是真实的异常值

用 IQR 方法识别 Fare 的极端值。不直接删，采用 **截断**（clip），把过高票价拉回合理范围：

```python
def detect_outliers_iqr(data, column, factor=1.5):
    Q1 = data[column].quantile(0.25)
    Q3 = data[column].quantile(0.75)
    IQR = Q3 - Q1
    lower = max(0, Q1 - factor * IQR)
    upper = Q3 + factor * IQR
    outliers = data[(data[column] < lower) | (data[column] > upper)]
    print(f"{column}: Q1={Q1:.1f}, Q3={Q3:.1f}, IQR={IQR:.1f}")
    print(f"  合理范围: [{lower:.1f}, {upper:.1f}]")
    print(f"  异常值数量: {len(outliers)} ({len(outliers) / len(data):.1%})")
    return lower, upper

lower, upper = detect_outliers_iqr(X_train, 'Fare')

# 截断而非删除：高票价可能是真实的，头等舱确实贵
X_train['Fare'] = X_train['Fare'].clip(lower=lower, upper=upper)
X_test['Fare']  = X_test['Fare'].clip(lower=lower, upper=upper)   # 用训练集算出的边界
```

## 特征编码

大多数机器学习算法只接受数值输入，必须把文本类别映射成数值。三种常见方法：

1. 序数编码（Ordinal Encoding）
2. 独热编码（One-Hot Encoding）
3. 标签编码（Label Encoding）

核心区别在于：是否保留类别的顺序信息，以及是否引入了虚假的数值大小关系。选哪种，取决于特征类型和模型算法。

原始数据长这样：

```text
   Survived     Sex  Pclass Embarked
0         0    male       3        S
1         1  female       1        C
2         1  female       3        S
3         1  female       1        S
4         0    male       3        S
```

### 序数编码

将类别映射为整数，并严格保留顺序：低 → 0，中 → 1，高 → 2。

适用于特征本身有明确等级，希望模型理解「高 > 中 > 低」：

- 教育程度：小学(1) < 初中(2) < 高中(3) < 本科(4) < 硕士(5) < 博士(6)
- 满意度：非常不满意(0) < … < 非常满意(4)
- 衣服尺码：XS(1) < S(2) < M(3) < L(4) < XL(5)
- 机舱：经济舱(1) < 商务舱(2) < 头等舱(3)

`sklearn` 的 `OrdinalEncoder` 默认按字母顺序编码，这里显式指定 `categories` 保证逻辑正确。Titanic 的 `Pclass` 本身已是数字 1、2、3，为了演示，把 Fare 分成三档：

```python
from sklearn.preprocessing import OrdinalEncoder

df_ordinal = X_train.copy()
df_ordinal['fare_category'] = pd.cut(df_ordinal['Fare'], bins=3, labels=['Low', 'Mid', 'High'])

oe = OrdinalEncoder(categories=[['Low', 'Mid', 'High']])   # 显式指定顺序
df_ordinal['fare_cat_encoded'] = oe.fit_transform(df_ordinal[['fare_category']])

print("顺序定义: Low < Mid < High -> 0, 1, 2")
print(df_ordinal[['fare_category', 'fare_cat_encoded']].head())
```

### 独热编码

线性模型（线性回归、逻辑回归、SVM、神经网络）通过数值大小和距离来学习规律。如果对 **无序** 类别（如颜色）直接用序数编码：红 = 1，绿 = 2，蓝 = 3，模型会认为蓝比红「大 3 倍」，绿介于红蓝之间。对颜色这种没有大小之分的概念，这个假设完全错误。

独热编码的思路：把每个类别取值变成一个独立的列，用一组 0 和 1 表示。

| 样本 | 颜色 | 错误的序数编码 |
|---|---|---|
| A | 红 | 1 |
| B | 绿 | 2 |
| C | 蓝 | 3 |

独热编码后：

| 样本 | 是红色 | 是绿色 | 是蓝色 |
|---|---|---|---|
| A | 1 | 0 | 0 |
| B | 0 | 1 | 0 |
| C | 0 | 0 | 1 |

每种颜色平等，没有大小顺序。

缺点：有 N 种类别就会产生 N 列（去掉一列基准后是 N−1 列）。3 种颜色没问题，1000 个城市名就是 1000 列，数据变得极其稀疏，计算变慢甚至内存溢出。类别很多时考虑 **目标编码** 或 **Embedding**。

```python
from sklearn.preprocessing import OneHotEncoder

df_ohe = X_train.copy()

ohe = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
# 输入必须是二维，所以用 [['Embarked']]
ohe_result = ohe.fit_transform(df_ohe[['Embarked']])

# 生成的列名，例如 Embarked_C
ohe_columns = ohe.get_feature_names_out(['Embarked'])
ohe_df = pd.DataFrame(ohe_result, columns=ohe_columns, index=df_ohe.index)

# 拼回主表，删掉原文本列
df_final = pd.concat([df_ohe.drop('Embarked', axis=1), ohe_df], axis=1)

print(f"生成的新列: {list(ohe_df.columns)}")
print(df_final.head())
```

### 标签编码

把类别简单映射为整数（0, 1, 2, …），不保证顺序，但引入了数值大小。适用场景只有三类：

1. **二分类特征**：如性别，0/1 等价于独热且更省空间
2. **分类任务的目标变量**：大多数分类算法要求目标是整数标签，这也是 `LabelEncoder` 的本职
3. **树模型**：XGBoost、随机森林等不依赖数值距离，可以接受整数编码的高维无序类别

严禁把标签编码用于线性模型的多分类无序特征，那种情况必须改用独热编码或序数编码。

```python
from sklearn.preprocessing import LabelEncoder

# 性别是二分类特征，可以用标签编码
le = LabelEncoder()
X_train_encoded = X_train.copy()
X_train_encoded['Sex'] = le.fit_transform(X_train['Sex'])   # female=0, male=1
```

> **补充**
> sklearn 的 `LabelEncoder` 是为 **目标变量** 设计的（只接受一维）。对特征列做整数编码，官方推荐用 `OrdinalEncoder`，它支持多列、能处理未见类别。

## 特征构造与删除

原始数据往往只是原材料，直接丢给模型效果通常不理想。需要合并、提取、删减，才能挖出数据背后的规律。基于对 Titanic 背景的理解，做三件事：

1. **合并特征**：把分散的亲属数量合并为「家庭规模」，标记「独自一人」的乘客。家庭结构可能直接影响逃生策略
2. **提取信息**：从看似无用的姓名中提取头衔（Mr、Mrs、Master），识别社会地位和特殊群体
3. **删减噪音**：删除缺失太多、格式混乱或无预测价值的列

```python
def create_features(df):
    df = df.copy()

    # 1. 家庭规模
    df['FamilySize'] = df['SibSp'] + df['Parch'] + 1

    # 2. 是否独自一人
    df['IsAlone'] = (df['FamilySize'] == 1).astype(int)

    # 3. 从姓名提取头衔 (Mr, Mrs, Miss, Master 等)
    df['Title'] = df['Name'].str.extract(r' ([A-Za-z]+)\.', expand=False)
    # 归并稀有头衔
    df['Title'] = df['Title'].replace(['Lady', 'Countess', 'Capt', 'Col', 'Don', 'Dr',
                                       'Major', 'Rev', 'Sir', 'Jonkheer', 'Dona'], 'Rare')
    df['Title'] = df['Title'].replace({'Mlle': 'Miss', 'Ms': 'Miss', 'Mme': 'Mrs'})

    # 4. 删除无用特征
    drop_cols = ['PassengerId', 'Name', 'Ticket']
    df = df.drop(columns=[c for c in drop_cols if c in df.columns])

    return df

X_train_fe = create_features(X_train)
X_test_fe  = create_features(X_test)

print("新增特征后形状:", X_train_fe.shape)
print(X_train_fe[['FamilySize', 'IsAlone', 'Title']].head())
```

## 特征缩放

Titanic 部分特征量纲差异极大：

```text
Age:        0 ~ 80      (十位数)
Fare:       0 ~ 100+    (百位数，截断后)
SibSp:      0 ~ 8       (个位数)
HasCabin:   0 or 1      (0-1)
```

直接训练会有两个问题：对于基于距离的算法（KNN、K-Means、SVM），数值大的特征会主导距离计算；对于梯度下降，损失函数的等高线会呈极度狭长的椭圆，参数更新反复震荡，需要极多迭代才能收敛，甚至无法收敛。

两种常见的缩放方式：

### 标准化 Standardization

最常用，把数据转换为均值 0、标准差 1：

{{< math >}}
z = \frac{x - \mu}{\sigma}
{{< /math >}}

标准化不会把数据压到固定区间，处理后可以是负数。

> **注意**
> 标准化基于均值和标准差，容易受异常值影响。

得益于前面对异常值的处理，标准化在这里比较稳定。它是线性模型、逻辑回归、神经网络和 SVM 的首选预处理方法。

```python
from sklearn.preprocessing import StandardScaler

numeric_cols = ['Age', 'Fare']

scaler = StandardScaler()
scaler.fit(X_train[numeric_cols])          # 只在训练集上 fit

X_train_scaled = X_train.copy()
X_test_scaled  = X_test.copy()
X_train_scaled[numeric_cols] = scaler.transform(X_train[numeric_cols])
X_test_scaled[numeric_cols]  = scaler.transform(X_test[numeric_cols])

print(X_train_scaled[numeric_cols].head())
print(f"\n均值检查 (应接近0): {X_train_scaled[numeric_cols].mean().values}")
print(f"标准差检查 (应接近1): {X_train_scaled[numeric_cols].std().values}")
```

### 归一化 Normalization

把数据线性变换到固定区间，通常是 \([0, 1]\)：

{{< math >}}
x' = \frac{x - x_{min}}{x_{max} - x_{min}}
{{< /math >}}

- 优点：严格限定范围，不会出现负数
- 缺点：受异常值影响明显。混入一个极大的离群点，其他正常值会被压到一小段区间里
- 适用：图像数据（像素天然有 0～255 的边界）、作为神经网络输入、算法强制要求数据范围时

> **补充**
> 树模型（决策树、随机森林、GBDT）对特征缩放不敏感，因为它们只看分裂阈值，不看距离。这也是树模型「预处理要求低」的原因。

## 工程实践：Pipeline

前面的步骤手动操作容易出错且难以维护。`sklearn` 提供 `Pipeline` 整合流程，`ColumnTransformer` 对不同类型的列做不同处理。意义：

1. **防止数据泄露**：自动保证 `fit` 只在训练集，`transform` 应用到测试集
2. **代码简洁**：预处理和模型封装在一起
3. **便于部署**：保存一个 `Pipeline` 对象即可用于生产预测

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

# 重新加载干净的原始划分（演示 Pipeline）
X_train, X_test, y_train, y_test = train_test_split(
    df.drop('Survived', axis=1), df['Survived'],
    test_size=0.2, random_state=42, stratify=df['Survived']
)

numeric_features = ['Age', 'Fare', 'SibSp', 'Parch']
categorical_features = ['Sex', 'Embarked', 'Pclass']   # Pclass 虽是数字，本质是类别

# 1. 数值列：填补缺失 -> 标准化
numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

# 2. 类别列：填补缺失 -> 独热编码
categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('onehot', OneHotEncoder(drop='first', handle_unknown='ignore'))   # 忽略测试集中没见过的类别
])

# 3. 组合两条流水线
preprocessor = ColumnTransformer(transformers=[
    ('num', numeric_transformer, numeric_features),
    ('cat', categorical_transformer, categorical_features)
])

# 4. 一键处理
X_train_ready = preprocessor.fit_transform(X_train)   # 训练集 fit_transform
X_test_ready  = preprocessor.transform(X_test)        # 测试集只 transform

print("预处理流水线搭建成功！生成的矩阵形状:", X_train_ready.shape)
```

把模型也接到 Pipeline 末尾，就能一行 `fit`、一行 `predict`：

```python
from sklearn.linear_model import LogisticRegression

clf = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('model', LogisticRegression(max_iter=1000))
])
clf.fit(X_train, y_train)
print(f"测试集准确率: {clf.score(X_test, y_test):.4f}")
```

## 原则总结

1. **Garbage In, Garbage Out**：数据质量决定模型上限，再好的算法也无法从垃圾数据中学到规律
2. **防止数据泄露**：先划分数据集，所有 `fit` 只在训练集上，测试集只做 `transform`
3. **EDA 驱动**：观测数据的实际分布，根据业务含义选填充策略、编码方式和特征变换
4. **Pipeline 封装**：把预处理、特征工程和模型封装成流水线，可复用、无泄露、易部署
