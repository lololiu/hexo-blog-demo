---
title: Android Studio插件开发实践--从创建到发布
date: 2016-07-17 11:05:45
tags: [android,插件,Android Studio] 
---
## Android Studio插件开发实践--从创建到发布

### 前言
 前几天在github发现一个蛮不错的Android Studio插件[ECTranslation](https://github.com/Skykai521/ECTranslation)，在一些源码注释中遇到不认识的英文单词可以很方便地查看中文翻译。当时怀着好奇心也想试着开发一个小插件，在网上查资料发现插件开发的资料很少，大部分blog都只是简单地搭建了个开发环境然后弹出个Hello World的对话框就完了，而jetbrains也只提供了一份[DevGuide](http://www.jetbrains.org/intellij/sdk/docs/index.html)并没有比较详细的API文档。因此遇到大部分都只能啃它的那份英文指导手册和参考别人发布在github的插件源码。现在这个小插件完成得差不多了，想把自己这几天的开发过程整理一下分享出来，希望能给其他有兴趣尝试plugin开发的朋友一点帮助。

**本项目github地址**:[varname-go-die](https://github.com/lololiu/varname-go-die),欢迎Star&Fork

### 明确需求
开发一款插件最先要考虑的当然是它要实现什么功能了。比如我想做的是varname-go-die主要功能就是让开发者有时候遇到起变量名但是不知道英文怎么拼时，不需要切换到翻译软件去查找再copy过来，只需要在编辑器中输入中文就可以实现联网翻译，并且可以通过一个列表选择自己设置的常用变量格式。

这是我考虑实现的功能：
1. 在Android Studio设置界面有VarNameGoDie的设置选项，开发者可以根据自己对变量名的命名风格进行设置
2. 在编辑器输入并选取要转换的中文，快捷键启动一个ChangeVar的Action，联网查找翻译并弹出设置中的变量名格式列表，选择后替换编辑器中的中文
3. 在编辑器中输入英文单词也可以进行格式转换

具体的效果参见下图：
![screenshot.gif](http://lololiu-blog.qiniudn.com/screenshot1.gif)

<!-- more -->

### 环境准备及项目创建
Android Studio是基于Intellij IDEA，网上查找后发现好像可以在Intellij IDEA中进行插件开发，Android Studio中new project是没有plugin选项的。
1. [下载Intellij IDEA](https://www.jetbrains.com/idea/#chooseYourEdition),Community是免费的
2. 创建plugin项目，File->New Project，然后按照下图操作，注意：关于Project SDK，如果没有需要创建一个，点击New，然后指向Intellij IDEA的安装目录就OK了。

![新建工程](http://lololiu-blog.qiniudn.com/create_project2.jpg)

成功建立工程后项目结构如下：

![项目结构](http://lololiu-blog.qiniudn.com/projectstructure3.png)

其中`plugin.xml`为项目的配置说明文件，相当于Android项目中的`AndroidManifest.xml`，负责一些Action、Extension等等已经项目版本信息、作者的注册和声明。
默认`plugin.xml`文件：
```xml
<idea-plugin version="2">
  <id>com.your.company.unique.plugin.id</id><!--插件ID，自定义，如果要上传到Plugins仓库不能有重复ID -->
  <name>Plugin display name here</name><!--插件名称-->
  <version>1.0</version>
  <vendor email="support@yourcompany.com" url="http://www.yourcompany.com">YourCompany</vendor><!--邮箱和网址，上传到Plugins仓库会在你的插件界面显示 -->

  <!-- 你的插件的简介，同样是显示在Plugins仓库信息界面 -->
  <description><![CDATA[
      Enter short description for your plugin here.<br>
      <em>most HTML tags may be used</em>
    ]]></description>

  <!-- 版本更新信息-->
  <change-notes><![CDATA[
      Add change notes here.<br>
      <em>most HTML tags may be used</em>
    ]]>
  </change-notes>

  <!-- please see http://www.jetbrains.org/intellij/sdk/docs/basics/getting_started/build_number_ranges.html for description -->
  <idea-version since-build="141.0"/>

<!--产品选择，后文会提 -->
  <!-- please see http://www.jetbrains.org/intellij/sdk/docs/basics/getting_started/plugin_compatibility.html
       on how to target different products -->
  <!-- uncomment to enable plugin in all products
  <depends>com.intellij.modules.lang</depends>
  -->

<!--扩展组件注册 要是用到applicationConfigurable即项目配置等就在这里注册-->
  <extensions defaultExtensionNs="com.intellij">
    <!-- Add your extensions here -->
  </extensions>

<!--Action注册，比如在某个菜单下增加一个按钮就要在这注册 -->
  <actions>
    <!-- Add your actions here -->
  </actions>

</idea-plugin>
```

### 编写一个菜单选项
点击菜单栏都会出来各种各样的菜单选项，大部分选项都会有快捷键支持，如我们常用的Undo、Copy等。
![菜单选项](http://lololiu-blog.qiniudn.com/menu_option4.png)
创建一个上图所示的菜单选项是很简单的：

![Create Action](http://lololiu-blog.qiniudn.com/create_action5.png)

然后填写这个Action的配置信息:

![填写Action配置](http://lololiu-blog.qiniudn.com/action_indo6.png)
**Action ID**:标识ID，就像Android中xml的组件@+id
**Class Name**：生成的类名
**Name、Description**：菜单选项的名字和描述
**Groups**：定义这个菜单选项出现的位置，比如我图中设置的当点击菜单栏Edit时，第一项会出现test的选项，右边的Anchor是选择该选项出现的位置，默认First即最顶部。

点击OK后会自动生成一个`TestAction.java`的类：
```java
public class TestAction extends AnAction {

    @Override
    public void actionPerformed(AnActionEvent e) {
        // TODO: insert action logic here
        //点击菜单Edit的test后会跳进这个方法
    }
}
```
而`plugin.xml`中也多了一段代码，即刚刚填写的配置信息：
```xml
<actions>
  <!-- Add your actions here -->
  <action id="Test.ID" class="TestAction" text="test" description="test test ">
    <add-to-group group-id="MainMenu" anchor="first"/>
    <keyboard-shortcut keymap="$default" first-keystroke="alt T"/>
  </action>
</actions>
```
这样，一个菜单选项就完成了，接下来就要实现当用户点击test菜单或者按快捷键`alt T`后的功能代码了。

### 对话框Dialog创建
和Action的创建一样，Dialog也可以直接在在src或者包名下右键->new ->Dialog,填写类名后会生成一个xxx.java和xxx.form的文件，xxx.java就是一个继承JDialog的类，了解一点java swing编程的同学都能看懂，而xxx.form是Intellij Idea自带的GUI Designer，可以通过可视化的界面设计轻松地创建用户界面布局。


![Dialog可视化界面设计](http://lololiu-blog.qiniudn.com/dialog_info7.png)
只需要开发者从右边将不同的组件拖动到中间布局的对应位置，然后在左下角设置适当的属性，则这些属性即可自动bind到xxx.java文件中的对应组件上。这简化了开发者写界面布局的繁琐操作，即使你不怎么懂swing编程，也可以很轻松地实现自己的界面。

当你设计好Dialog的界面并实现里面的数据加载和按钮或其他事件的监听操作，当你想要把它显示出来，也只需要简单的两行代码：
```java
TestDialog dialog = new TestDialog();
dialog.setVisible(true);    
```

### 编写一个Configurable功能
当你的插件需要或允许用户自定义一些配置时，比如我的插件允许用户定义自己想要生成的代码风格，只需用户打开Settings->other settings就会看到一个配置界面：

![Configurable](http://lololiu-blog.qiniudn.com/Configurable8.png)
刚开始需要实现这个功能，找了挺久未果，在查看一些比较火的插件时发现ButterKnifeZelezny项目也有这种功能实现，因此去github找到了项目源码并模仿着实现了这个功能。所以当有时候遇到某些功能实现没有找到很好的资料时，可以去查查一些其他作者的项目，看看能不能找到类似的学习学习。

实现一个配置界面需要自己实现设置界面，并且实现Configurable的接口。实现界面像Dialog的创建一样，new->GUI Form这样也会生成一个java文件和一个form文件，同样的设计好界面，然后在java文件中实现Configurable接口，需要`Override`一些方法：

![Configurable](http://lololiu-blog.qiniudn.com/Configurable_method9.png)
`getDisplayName()`:Other Settings下显示的配置名称
`getHelpTopic()`:看方法名像是获取帮助时展示的信息，没用到
`createComponent()`:组件创建和初始数据配置
`apply()`:当配置界面点击底下的apply按钮调用该方法，一般在这里保存修改的数据
`reset()`:配置界面点击右上角的Reset调用该方法，一般还原初始化数据

当设计界面的时候，有时候需要自定义一些组件，比如需要在JList里加入JCheckBox之类的，直接在form中将JCheckBox拖到JList中貌似是不行的，需要在form界面右下角对应组件的Property-Value配置栏中勾选Custom Create项，就会在java文件中生成`createUIComponents`方法，然后在这个方法里面创建并添加。

当设计界面并在java文件中实现好功能后，只需在 `plugin.xml`进行注册后即可实现配置界面了：
```xml
<extensions defaultExtensionNs="com.intellij">
    <applicationConfigurable instance="com.royll.varnamegodie.settings.SettingsUI"/>
</extensions>
```

至此，基本界面设计都完成的差不多了，下面说说我在开发项目中遇到的一些具体功能性问题。
### 编辑器获取用户选择内容并替换
varname-go-die首先需要得到用户选取要转换的英文/中文词组，怎么获取用户此时选取的内容呢？
```java
Editor mEditor = e.getData(PlatformDataKeys.EDITOR);
String selectText = mEditor.getSelectionModel().getSelectedText();
```
这样用户此时选取的内容就获得了，那要怎样将其替换成其他内容呢？
```java
private void changeSelectText(String text) {
    Project  mProject = e.getData(PlatformDataKeys.PROJECT);
    Document document = mEditor.getDocument();
    SelectionModel selectionModel = mEditor.getSelectionModel();

    final int start = selectionModel.getSelectionStart();
    final int end = selectionModel.getSelectionEnd();
    Runnable runnable = new Runnable() {
        @Override
        public void run() {
            document.replaceString(start, end, text);
        }
    };
    WriteCommandAction.runWriteCommandAction(mProject, runnable);
    selectionModel.removeSelection();
}
```
通过以上代码，即可成功替换用户所选的内容。

### Settings配置信息保存
当用户在settings中设置自定义一些配置，你需要保存起来，并在应用到的时候读取出来。
```java
PropertiesComponent.getInstance().setValue() //保存基本类型及String等
PropertiesComponent.getInstance().setValues() //可保存数字
```
获取参数的方法与之类似，Android开发的同学一点能够轻易想到Android中类似的SharedPreferences。

### 运行及调试插件

![运行插件](http://lololiu-blog.qiniudn.com/run_10.png)
点击Run即可运行插件，会重开一个Intellij Idea，基本设置和创建test工程后插件项目效果在新开的工程中体现。

### 插件打包发布、上传Plugins仓库
插件代码实现并调试成功后，如果你想要开源出来让更多的小伙伴都能用到，你只需要将自己的项目打包成jar，然后发送给需要的人，对方在Settings->Plugins界面即可通过Install plugin from disk然后在本地找到jar文件安装即可使用了。但是这样太麻烦，你想让小伙伴直接通过Browse repositories在仓库中即可找到自己开发的插件，这时你就需要将自己的jar上传到对应IDE的plugins仓库并等待通过审核。
**打包**：右键项目名->Prepare Plugin Module 'xxxx' For Deployment,稍后会在项目下生成jar包
**发布**：
1. plugin发布到官方仓库[地址](https://plugins.jetbrains.com/)
2. 还记得`plugin.xml`中注释的那段代码么：
```xml
  <!-- please see http://www.jetbrains.org/intellij/sdk/docs/basics/getting_started/plugin_compatibility.html
       on how to target different products -->
  <!-- uncomment to enable plugin in all products
  <depends>com.intellij.modules.lang</depends>
  -->
```
这是指定你的插件发布到jetbrains plugins仓库的产品类型，jetbrains公司有很多种产品，并且都支持插件开发，如Intellij Idea,Android Studio等等，如果你上面那段代码注释了，那么你在上面网站上传的时候会默认上传到Intellij Idea的产品仓库，到时候只能在Intellij Idea的仓库中搜到你的插件，Android Studio是没有的。因此详细配置说明请参考上面注释中给出的网站上查看配置。我的插件将默认的`<depends>com.intellij.modules.lang</depends>`打开，即默认上传到所以产品仓库，便可以在多个IDE插件仓库中搜索到。
3. 修改完`plugin.xml`并生成jar后，到步骤1中的官网上注册用户，然后Add New Plugin,填写插件相关的信息，剩下的只要等待1天左右的审核，就可以在插件仓库中查询到自己的插件并安装使用了！

![查找插件](http://lololiu-blog.qiniudn.com/search11.png)

### Thanks
* [ECTranslation](https://github.com/Skykai521/ECTranslation)
* [android-butterknife-zelezny](https://github.com/avast/android-butterknife-zelezny)
* [IntelliJ Platform SDK DevGuide](http://www.jetbrains.org/intellij/sdk/docs/index.html)

### 写在最后
花了几天时间各种查阅资料各种折腾终于把想要的功能实现了，感觉还是蛮不错的，同时也把我这开发经历分享出来，希望能给其他想跃跃欲试着的开发者朋友带来一点帮助，也希望更多有着奇思妙想的朋友们给我们分享更多能让我们可以更加“偷懒”的插件。
同时我的代码也开源在github上---[varname-go-die](https://github.com/lololiu/varname-go-die),欢迎大家Star&Fork&Follow！  : )