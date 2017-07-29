---
title: Butter Knife中文文档
date: 2016-06-06 21:40:45
tags: [android,butter knife] 
categories: essay
---
### Butter Knife中文文档

![butter knife](http://lololiu-blog.qiniudn.com/butterknife.png)

> Field and method binding for Android views

Butter knife通过使用 `@bind` 和一个view的ID进行注解，可以在layout中找到并将其自动投射(cast)成对应的view。
```java
class ExampleActivity extends Activity {
  @BindView(R.id.title) TextView title;
  @BindView(R.id.subtitle) TextView subtitle;
  @BindView(R.id.footer) TextView footer;

  @Override public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.simple_activity);
    ButterKnife.bind(this);
    // TODO Use fields...
  }
}
```
<!-- more -->

调用`bind`方法即可生成代码执行查找对应view，上面例子中`ButterKnife.bind(this)`的代码大概相当于如下：
```java
public void bind(ExampleActivity activity) {
  activity.subtitle = (android.widget.TextView) activity.findViewById(2130968578);
  activity.footer = (android.widget.TextView) activity.findViewById(2130968579);
  activity.title = (android.widget.TextView) activity.findViewById(2130968577);
}
```

#### 绑定资源
可以用`@BindBool`，`@BindColor`，`@BindDimen`，`@BindDrawable`，`@BindInt`和`@BindString`通过绑定`R.bool`以及其他对应id来进行资源的预定义。
```java
class ExampleActivity extends Activity {
  @BindString(R.string.title) String title;
  @BindDrawable(R.drawable.graphic) Drawable graphic;
  @BindColor(R.color.red) int red; // int or ColorStateList field
  @BindDimen(R.dimen.spacer) Float spacer; // int (for pixel size) or float (for exact value) field
  // ...
}
```

#### 绑定非Activity视图
只要你能提供根视图(view root)，butter knife可以在任意对象中执行绑定操作。
```java
public class FancyFragment extends Fragment {
  @BindView(R.id.button1) Button button1;
  @BindView(R.id.button2) Button button2;

  @Override public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
    View view = inflater.inflate(R.layout.fancy_fragment, container, false);
    ButterKnife.bind(this, view);
    // TODO Use fields...
    return view;
  }
}
```
还可以帮助你在为一个listview做适配器(adapter)时简化ViewHolder的创建：
```java
public class MyAdapter extends BaseAdapter {
  @Override public View getView(int position, View view, ViewGroup parent) {
    ViewHolder holder;
    if (view != null) {
      holder = (ViewHolder) view.getTag();
    } else {
      view = inflater.inflate(R.layout.whatever, parent, false);
      holder = new ViewHolder(view);
      view.setTag(holder);
    }

    holder.name.setText("John Doe");
    // etc...

    return view;
  }

  static class ViewHolder {
    @BindView(R.id.title) TextView name;
    @BindView(R.id.job_title) TextView jobTitle;

    public ViewHolder(View view) {
      ButterKnife.bind(this, view);
    }
  }
}
```
你可以在提供的示例代码中看到具体用法。
你可以在任何允许调用`findViewById`的地方调用`ButterKnife.bind`。

其他提供的Apis：
- 你可以绑定根视图是activity的任意对象，如果你在使用MVC模式进行开发，你可以通过`ButterKnife.bind(this, activity)`绑定该控制器(controller)。
- 使用`ButterKnife.bind(this)`绑定一个view中的子view中的字段，如果你在一个布局文件中使用`<merge>`标签，并且该布局在一个自定义控件的结构体中inflate进入，那你便可以在后面使用它来进行绑定其中字段。另外，从XML中inflate的自定义视图类型可以在`onFinishInflate()`回调方法中使用它。

#### 视图列表
你可以将多个view组成一个list或者array。
```java
@BindViews({ R.id.first_name, R.id.middle_name, R.id.last_name })
List<EditText> nameViews;
```
`apply` 方法可以让你的list的所有view立刻进行某个动作。
```java
ButterKnife.apply(nameViews, DISABLE);
ButterKnife.apply(nameViews, ENABLED, false);
```
`Action`和`Setter`接口允许指定一些简单的行为。
```java
static final ButterKnife.Action<View> DISABLE = new ButterKnife.Action<View>() {
  @Override public void apply(View view, int index) {
    view.setEnabled(false);
  }
};
static final ButterKnife.Setter<View, Boolean> ENABLED = new ButterKnife.Setter<View, Boolean>() {
  @Override public void set(View view, Boolean value, int index) {
    view.setEnabled(value);
  }
};
```
你也可以通过`apply`指定view的某些属性([Property
](https://developer.android.com/reference/android/util/Property.html))
```java
ButterKnife.apply(nameViews, View.ALPHA, 0.0f);
```
#### 绑定监听器
监听器可以自动绑定到方法中
```java
@OnClick(R.id.submit)
public void submit(View view) {
  // TODO submit data to server...
}
```
定义一个特定的类型view，它也会被自动cast
```java
@OnClick(R.id.submit)public void sayHi(Button button) { button.setText("Hello!");}
```
一次绑定多个特定的IDs来进行平常事件处理
```java
@OnClick({ R.id.door1, R.id.door2, R.id.door3 })
public void pickDoor(DoorView door) {
  if (door.hasPrizeBehind()) {
    Toast.makeText(this, "You win!", LENGTH_SHORT).show();
  } else {
    Toast.makeText(this, "Try again", LENGTH_SHORT).show();
  }
}
```
自定义不需要特定的id就可以绑定它们自己的监听器
```java
public class FancyButton extends Button {
  @OnClick
  public void onClick() {
    // TODO do something!
  }
}
```

#### 绑定复位(解绑)
Fragment和Activity相比有着不一样的生命周期，在`onCreateView`中绑定一个fragment，需要在`onDestroyView`中将它的所有view都设为null。butter knife会在你`bind`的时候返回一个`Unbinder`类型的实例给你，你可以在适当的生命周期中调用该实例对象的`unbind`方法进行解绑。
```java
public class FancyFragment extends Fragment {
  @BindView(R.id.button1) Button button1;
  @BindView(R.id.button2) Button button2;
  private Unbinder unbinder;

  @Override public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
    View view = inflater.inflate(R.layout.fancy_fragment, container, false);
    unbinder = ButterKnife.bind(this, view);
    // TODO Use fields...
    return view;
  }

  @Override public void onDestroyView() {
    super.onDestroyView();
    unbinder.unbind();
  }
}
```

####  可选绑定
默认情况下，`@bind`和监听器绑定都必须有一个目标view，当butter knife找不到对应的view时会抛出一个异常。
为了防止这种异常情况的发生，可以在绑定的字段前面使用`@Nullable`注解，在绑定的方法前面则可使用`@Option`注解，来表明对应的是一个可选绑定。

注：任何名为`@Nullable`第三方的注解都可以对字段起作用，这里推荐使用 [Android's "support-annotations" library](http://tools.android.com/tech-docs/support-annotations)提供的`Nullable`注解。
```java
@Nullable @BindView(R.id.might_not_be_there) TextView mightNotBeThere;

@Optional @OnClick(R.id.maybe_missing) void onMaybeMissingClicked() {
  // TODO ...
}
```

#### 其他福利
butter knife还包括一个`findById`方法在必须要在View,Activity或Dialog中查找某些子view的情况下简化代码，它会使用泛型来推断其返回类型并自动投射(cast)上去。
```java
View view = LayoutInflater.from(context).inflate(R.layout.thing, null);
TextView firstName = ButterKnife.findById(view, R.id.first_name);
TextView lastName = ButterKnife.findById(view, R.id.last_name);
ImageView photo = ButterKnife.findById(view, R.id.photo);
```
为`ButterKnife.findById`添加一个静态引用来享受更大的乐趣吧！

#### 下载方式
在Gradle中添加
```gradle
compile 'com.jakewharton:butterknife:(insert latest version)'
apt 'com.jakewharton:butterknife-compiler:(insert latest version)'
```