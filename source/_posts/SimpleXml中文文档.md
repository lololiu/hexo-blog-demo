---
title: SimpleXml中文文档
date: 2016-12-16 14:51:45
tags: [android,simple,xml] 
---

# [SimpleXml](http://simple.sourceforge.net/home.php)中文文档

![](http://lololiu-blog.qiniudn.com/xml_pic.png)

### 目录

- [序列化一个简单对象](#序列化一个简单对象)
- [反序列化一个简单对象](#反序列化一个简单对象)
- [嵌套对象的序列化](#嵌套对象的序列化)
- [可选元素和属性](#可选元素和属性)
- [读取元素列表](#读取元素列表)
- [重写带注解的类型](重写带注解的类型)
- [处理元素的内联列表](#处理元素的内联列表)
- [构造函数注入](#构造函数注入)
- [读取数组元素(array)](#读取数组元素)
- [为元素添加文本和属性](#为元素添加文本和属性)
- [处理Map对象](#处理Map对象)	
	
### 序列化一个简单对象
为了将一个对象序列化成XML，必须先在对象内部添加一系列注解，这些注解的作用是告诉解析器该如何去序列化标记的这个对象。如下面代码中，一共有三个不同的注解，`@Root`用于标识根元素（root element），`@Element`用于标识XML的消息元素(message element)，最后一个`@Attribute`用于标识一个属性元素。
```java
@Root
public class Example {

   @Element
   private String text;

   @Attribute
   private int index;

   public Example() {
      super();
   }  

   public Example(String text, int index) {
      this.text = text;
      this.index = index;
   }

   public String getMessage() {
      return text;
   }

   public int getId() {
      return index;
   }
}
```
要序列化上述对象的实例，需要用到[ Persister](http://simple.sourceforge.net/download/stream/doc/javadoc/org/simpleframework/xml/core/Persister.html)对象，然后提供一个含有注解的对象的实例和一个输出结果，这个例子中是一个文件，当然你也可以输出为其他格式的结果。
```java
Serializer serializer = new Persister();
Example example = new Example("Example message", 123);
File result = new File("example.xml");

serializer.write(example, result);
```
一旦执行上述代码，对象实例将作为XML文档传输到指定的文件,生成的XML文件将包含如下所示的内容:
```xml
<example index="123">
   <text>Example message</text>
</example>
```
除了使用对象中定义的字段名去获取XML中的相同命名的元素和属性，我们还可以自定义命名。每一个注解都包含一个`name`属性，我们可以用它来指定生成的XML中的属性或元素的名字。这确保如果对象具有不可用的字段或方法名称，可以将它们自定义为其他可以名称，如果你的代码被混淆，自定义命名唯一可以保证使序列化和反序列化对象一致的方式。下面是`Example`对象使用自定义名字的例子：
```java
@Root(name="root")
public class Example {

   @Element(name="message")
   private String text;

   @Attribute(name="id")
   private int index;

   public Example() {
      super();
   }  

   public Example(String text, int index) {
      this.text = text;
      this.index = index;
   }

   public String getMessage() {
      return text;
   }

   public int getId() {
      return index;
   }
}
```
以上对象在生成XML文档时会构造出跟前一个例子中不同格式的结果，这里XML的元素和属性名称都被对象中的注解名称所`override`：
```xml
<root id="123">
   <message>Example message</message>
</root>
```

### 反序列化一个简单对象
利用Persister进行XML反序列化成对象同样是很简单的事情，我们只需要提供一个通过注解标志了XML文档结构的类和一份XML文档，通过Persister对象的`read`方法，生成一个目标对象的实例。另外需要注意的是，由于方法是通用的，因此不需要从读取方法强制转换返回值。反序列化示例代码如下：
```java
Serializer serializer = new Persister();
File source = new File("example.xml");

Example example = serializer.read(Example.class, source);
```

### 嵌套对象的序列化
`Simple`除了可以序列化简单对象，还可以序列化内嵌对象---不管这个对象中包含多少内嵌对象、包含多少层内嵌。下面的实例代码展示了多个对象连接到一起形成一个可序列化的实体对象，最开始的`Configuration `对象中包含一个`Server`对象，而在`Server`对象中又包含一个`Security `对象：
```java
@Root
public class Configuration {

   @Element
   private Server server;

   @Attribute
   private int id;

   public int getIdentity() {
      return id;
   }

   public Server getServer() {
      return server;           
   }
}

public class Server {

   @Attribute
   private int port;

   @Element
   private String host;

   @Element
   private Security security;

   public int getPort() {
      return port;           
   }

   public String getHost() {
      return host;           
   }

   public Security getSecurity() {
      return security;           
   }
}

public class Security {

   @Attribute
   private boolean ssl;

   @Element
   private String keyStore;

   public boolean isSSL() {
      return ssl;           
   }

   public String getKeyStore() {
      return keyStore;           
   }
}
```
为了创建一个初始化的配置对象，可以借助一个XML文档，这个XML文档需要与对象中的XML注解匹配。上面的`Configuration `的XML文档结构如下所示：
```xml
<configuration id="1234">
   <server port="80">
      <host>www.domain.com</host>
      <security ssl="true">
         <keyStore>example keystore</keyStore>
      </security>
   </server>
</configuration>
```
通过查看XML文档中的元素和属性与需要序列化的对象中的注解一一对应起来判断是否映射成功，映射关系非常简单，我们花一点时间就会理解并掌握。

### 可选元素和属性
有时候，由于源XML中有些属性或者元素并不是必须返回的，又或者对象的有些字段为null无法进行序列化，因此有些情况需要对对象中的注解添加一个可选的说明，下列代码演示一个可选元素和属性的例子：
```java
@Root
public class OptionalExample {

   @Attribute(required=false)
   private int version;

   @Attribute
   private String id;

   @Element(required=false)
   private String name;   

   @Element
   private String address;

   public int getId() {
      return id;
   }

   public int getVersion() {
      return version;
   }

   public String getName() {
      return name;
   }

   public String getAddress() {
      return address;
   }
}
```
在上面对象中，`version`和`name`不是必需的字段，所以就是是XML文档中没有这两个名称的元素，这个对象也能够有效地序列化，比如下面的XML：
```xml
<optionalExample id="10">
   <address>Some example address</address>
</optionalExample>
```
即使没有`version`和`name`节点，此文档也可以反序列化为对象。当XML包含可选详细信息并允许更灵活的解析时，此功能非常有用。为了进一步阐明可选字段的实现，以下面的示例为例。这显示了如何从包含在文件中的上述文档中反序列化入口对象。反序列化完成后，我们可以检查对象的值：
```java
Serializer serializer = new Persister();
File source = new File("example.xml");
OptionalExample example = serializer.read(OptionalExample.class, source);

assert example.getVersion() == 0;
assert example.getName() == null;
assert example.getId() == 10;
```

### 读取元素列表
在XML配置和Java对象中，通常存在从父对象到子对象的一对多关系。为了支持这种公共关系，`Simple`已经提供了`ElementList`注解，它允许一个注解过的类作为Java集合对象中的实体。看下面示例代码：
```java
@Root
public class PropertyList {

   @ElementList
   private List<Entry> list;

   @Attribute
   private String name;

   public String getName() {
      return name;
   }

   public List getProperties() {
      return list;
   }
}

@Root
public class Entry {

   @Attribute
   private String key;

   @Element
   private String value;

   public String getName() {
      return name;
   }

   public String getValue() {
      return value;
   }
}
```
从上面的代码片段中可以看到列表元素的注解，字段类型被实例化为来自Java集合框架的匹配的具体对象，通常它是一个数组列表，但是其实它可以是任何的集合对象，只要字段类型声明提供一个具体的实现类型，而不是上面示例中所示的抽象列表类型。

下面是与上面类匹配的XML文档。这里每个`entry`元素将使用声明`Entry`类进行反序列化，并插入到创建的集合实例中。一旦所有入口对象已经被反序列化，PropertyList对象实例中会有一个包含各个属性对象的`Entry`集合。
```xml
<propertyList name="example">
   <list>
      <entry key="one">
         <value>first value</value>
      </entry>
      <entry key="two">
         <value>first value</value>
      </entry>
      <entry key="three">
         <value>first value</value>
      </entry>
      <entry key="four">
         <value>first value</value>
      </entry>
   </list>
</propertyList>
```
从上述示例可以看出，每个条目的细节取自集合的通用类型。它声明一个列表，其条目类作为其通用参数。这种类型的声明通常是不可能的，例如如果专用列表包含多个通用类型，其中一个是用于反序列化或序列化的正确类型。在这种情况下，必须明确提供类型。请参见以下示例。
```java
@Root
public class ExampleList {

   @ElementList(type=C.class)
   private SpecialList<A, B, C> list;

   public SpecialList<A, B, C> getSpecialList() {
      return list;
   }
}
```
在上面的例子中，特殊列表有三个通用参数，但是只有一个用作集合的通用参数。可以看出，当需要声明使用哪种类型时，可以通过`ElementList`注解的type属性来完成。

### 重写带注解的类型
为了在反序列化过程中容纳动态类型，可在XML元素中添加一个`class`属性，确保该元素可以被实例化为属性中声明的类型。这样的话类中的字段和方法类型也可以去引用抽象类和接口，它还允许将多个类型添加到带有注解的集合中。
```java

package example.demo;

public interface Task {

   public double execute();
}

@Root
public class Example implements Task {

   @Element
   private Task task;

   public double execute() {
      return task.execute();
   }  
}

public class DivideTask implements Task {

   @Element(name="left")
   private float text;

   @Element(name="right")
   private float right;

   public double execute() {
      return left / right;
   }
}

public class MultiplyTask implements Task {

   @Element(name="first")
   private int first;

   @Element(name="second")
   private int second;

   public double execute() {
      return first * second;
   }
}
```
这个`class`属性必须是完全限定类名，以便上下文类加载器可以加载它。下面的示例XML文档声明了需要反序列化的`task`对象的`class`类型，这样通过XML中`class`属性类型，就可动态指定`Example `类中的`Task`类型的`task`对象其具体实现是`DivideTask`而不是`MultiplyTask `：
```xml
<example>
   <task class="example.demo.DivideTask">
      <left>16.5</left>
      <right>4.1</right>
   </task>
</example> 
```
为了执行XML文档中描述的`task`，可以使用以下代码。这里假设XML源包含在文件中。一旦示例对象已被反序列化，则可以执行任务并获取结果。
```java
Serializer serializer = new Persister();
File example = new File("example.xml");
Example example = serializer.read(Example.class, example)

double value = example.execute();
```

### 处理元素的内联列表
有时候处理一些第三方XML也许会遇到如下所示的XML文档，一组相关联的元素（类似数组）并没有使用父元素包起来而和其他元素放在同一层级。为了处理这样的结构，我们可以将元素列表注解配置为忽略列表的父元素。
```xml
<propertyList>
   <name>example</name>
   <entry key="one">
      <value>first value</value>
   </entry>
   <entry key="two">
      <value>second value</value>
   </entry>
   <entry key="three">
      <value>third value</value>
   </entry>
</propertyList>
```
在上述XML文档中，有一系列`entry`元素，但与前面的示例不同，这些元素不包含在父元素中。为了实现这一点，[ElementList](http://simple.sourceforge.net/download/stream/doc/javadoc/org/simpleframework/xml/ElementList.html)注解的`inline`属性可以设置为true。以下代码段演示了如何使用`inline`属性来处理上述XML文档。
```java
@Root
public class PropertyList {

   @ElementList(inline=true)
   private List<Entry> list;

   @Element
   private String name;

   public String getName() {
      return name;
   }

   public List getProperties() {
      return list;
   }
}
```
使用内联元素列表有很多条件。首先，内联列表中的每个元素必须一个接一个放置，它们不能分散在其他元素之间。此外，列表中的每个条目类型必须具有相同的根名称，为了说明请看以下示例。
```java
package example.demo;

@Root
public class Entry {

    @Attribute
    protected String key;

    @Element
    protected String value;

    public String getKey() {
       return key;
    }
}

public class ValidEntry extends Entry {

   public String getValue() {
      return value;
   }
}

@Root
public class InvalidEntry extends Entry {

   public String getValue() {
      return value;
   }
}

@Root(name="entry")
public class FixedEntry extends InvalidEntry {
}
```
上面所有的类型都继承自相同的基本类型，因此它们都可以成为`propertyList`的备选项。然而，虽然所有类型都可以通过使用列表成功进行序列化和反序列化，但是却只有部分可以在内联列表中序列化。例如，类型`InvalidEntry`不能被序列化，因为它将使用与所有其他实体实现不同的名称来序列化。`InvalidEntry`对象具有`Root`注解，这意味着其XML元素名称将为“InvalidEntry”。为了与内联列表一起使用，所有对象必须具有相同的XML元素名称“entry”。`FixedEntry`通过继承`InvalidEntry`并明确指定名称为“entry”，因此在内联列表中使用是没有任何问题的。下面的XML文档表示在内联列表中表示`entry`类型的多种混合实现。
```xml
<propertyList>
   <name>example</name>
   <entry key="one" class="example.demo.ValidEntry">
      <value>first value</value>
   </entry>
   <entry key="two" class="example.demo.FixedEntry">
      <value>second value</value>
   </entry>
   <entry key="three" class="example.demo.Entry">
      <value>third value</value>
   </entry>
</propertyList>
```
内联列表中的所有上述`entry`元素都包含相同的XML元素名称。此外，每个类型都被指定为`Entry`的子类实现。

### 构造函数注入
在我们的程序中有时候需要一些不可变对象，这些对象没有相应字段的setters方法，它们通过使用构造函数来注入数据或设置内部状态。当你想序列化或反序列化一个不可变对象，也不想提供setters，你可以这么做。
```java
@Root
public class OrderManager {

    private final List<Order> orders;

    public OrderManager(@ElementList(name="orders") List<Order> orders) {
        this.orders = orders;
    }

    @ElementList(name="orders")
    public List<Order> getOrders() {
        return orders;
    }
}

@Root
public class Order {

    @Attribute(name="name")
    private final String name;

    @Element(name="product")
    private final String product;

    public Order(@Attribute(name="name") String name, 
                 @Element(name="product") String product) 
    {
        this.product = product;
        this.name = name;
    }

    public String getProduct() {
        return product;
    }
}
```
上面的代码说明了一个包含不可变`List<Order>`列表对象的`OrderManager`。在反序列化时，值从XML文档获取并注入到构造函数中以实例化对象。这是一个在序列化框架中并不常见的功能，但是这种构造函数注入有一个限制，它必须在get方法或字段上添加注解，以便在序列化时，`persister `知道在哪里获得要写入的数据。例如在上面的代码中，如果`getOrders`方法没有注释，那么就没有办法确定如何写`orders`对象。下面是由`OrderManager `序列化产生的示例XML：
```xml
<orderManager>
    <order name="AX101">
        <product>Product A</product>
    </order>
    <order name="AX102">
        <product>Product B</product>
    </order>
    <order name="AX103">
        <product>Product C</product>
    </order>
</orderManager>
```

### 读取数组元素
`Simple`除了可以将XML反序列化到一个集合(Collection )里，也可以对数组(array)进行序列化和反序列化。然而，与`@ElementList`注解不同，`ElementArray`注解可以反序列化原始值，如int数组，char数组等。
```java
@Root
public class AddressBook {

   @ElementArray
   private Address[] addresses;   

   @ElementArray
   private String[] names;        

   @ElementArray
   private int[] ages;   

   public Address[] getAddresses() {
      return addresses;           
   }

   public String[] getNames() {
      return names;           
   }

   public int[] getAges() {
      return ages;           
   }
}

@Root
public class Address {

   @Element(required=false)
   private String house;        

   @Element
   private String street;  

   @Element
   private String city;

   public String getHouse() {
      return house;           
   }

   public String getStreet() {
      return street;           
   }

   public String getCity() {
      return city;           
   }     
}
```
上面对象的原始类型（包括基本类型int和引用类型string）数组需要提供一个实体名称的属性，因为原始类型不能使用`@root`注解，必须要有一个属性告诉解析器XML元素的类型。上面对象生成的XML文档：
```xml
<addressBook>
   <addresses length="3">
      <address>
         <house>House 33</house>
         <street>Sesame Street</street>
         <city>City</city>
      </address>
      <address>
         <street>Some Street</street>
         <city>The City</city>
      </address>
      <address>
         <house>Another House</house>
         <street>My Street</street>
         <city>Same City</city>
      </address>
   </addresses>
   <names length="3">
      <string>Jonny Walker</string>
      <string>Jack Daniels</string>
      <string>Jim Beam</string>
   </names>
   <ages length="3">
      <int>30</int>
      <int>42</int>
      <int>31</int>
   </ages>
</properties>
```
从以上XML可以看出，数组索引中的每个实体的命名与它的类型相同。因此，一个字符串被包装在一个'string'元素中，而一个int被包装在一个'int'元素中。这是因为`ElementArray`注解的默认名称就是数组的类型，如果你想使用其他名称，需要在注解中提供一个实体的名称，如下代码：
```java
@Root
public class NameList {

   @ElementArray(entry="name")
   private String[] names;        

   public String[] getNames() {
      return names;           
   }
}
```
因为上面的代码表明了`entry="name"`，所以names在XML中用`name`作为元素名称，下面的XML文档是有效的：
```xml
<nameList>
   <names length="3">
      <name>Jonny Walker</name>
      <name>Jack Daniels</name>
      <name>Jim Beam</name>
   </names>
</nameList>
```

### 为元素添加文本和属性
在上一个例子中我们使用`Element`注解将原始类型比如String成功地添加到了`names`元素中。其实我们还可以往这元素中再添加属性，看下面示例：
```java
@Root
public class Entry {

   @Attribute
   private String name;

   @Attribute
   private int version;     

   @Text
   private String value;

   public int getVersion() {
      return version;           
   }

   public String getName() {
      return name;
   }

   public String getValue() {
      return value;              
   }
}
```
这个类使用`@Attribute`注解分别标记一个String类型的`name`和int类型的`version`，然后使用`@Text`注解了一个String类型的`value`，使用这个类可以序列化成如下XML：
```xml
<entry version='1' name='name'>
   Some example text within an element
</entry>  
```
`@Text`注解的使用有如下规则：1.每一个Entry类中只能有一个`@Text`注解。2.这个注解不能和`@Element`注解一起使用。3.只有`@Attribute`注解可以和它一起使用因为`@Attribute`不会往元素中添加任何内容。

### 处理Map对象
虽然在处理重复内容上我们可以使用lists，但是有时候使用`Map`会显得更方便。我们可以使用`@ElementMap`注解来处理map对象，而且这个注解可以在原始对象和综合对象都可以使用。
```xml
<properties>
   <property key="one">first value</property>
   <property key="two">second value</property>
   <property key="three">third value</property>
   <name>example name</name>
</properties>
```
在上述XML文档中，`properties`元素的序列可用于描述字符串的映射，其中`key`属性充当`properties`元素内的`value`的key。下面的代码演示了如何使用`@ElementMap`注解来处理上面的XML文档。
```java
@Root(name="properties")
public class PropertyMap {

   @ElementMap(entry="property", key="key", attribute=true, inline=true)
   private Map<String, String> map;

   @Element
   private String name;  

   public String getName() {
      return name;
   }

   public Map<String, Entry> getMap() {
      return map;
   }
}
```

以上列出了`Simple`常用操作教程，更多内容请参考[官网教程](http://simple.sourceforge.net/download/stream/doc/tutorial/tutorial.php)。