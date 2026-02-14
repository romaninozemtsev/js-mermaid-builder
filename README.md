# JS Mermaid Builder

MermaidJS programmatic markup builder.

This is a port of a [python mermaid builder](https://github.com/romaninozemtsev/python-mermaid-builder)

MermaidJS is an amazing product, but the syntax is very human readable and writeable (comparing to graphviz for exmaple).

for example,

- node or arrow shape on a flowchart is something that is easy to see as ASCII, but not easy to adhoc script.
- to style a link you have to know it's position 

This library should help to write mermaidJS markup, which then can be combined with Mermaid.JS library.


## how to use

```typescript
const chart = new Chart('Test', ChartDir.TB);
const node1 = new ChartNode('this is my node', NodeShape.HEXAGON, 'my-node');
const node2 = new ChartNode('this is my second node');
chart.addNode(node1).addNode(node2);
const link = new Link(node1.getId(), node2.getId(), 'this is my link');
link.style = new LinkStyle({
    color: 'red',
    strokeWidth: '2px'
});
chart.addLink(link);

const subgraph = new Subgraph('My Subgraph', ChartDir.LR);
subgraph.addNode(new ChartNode('i am a node inside subgraph'));

const subgraph2 = new Subgraph('subgraph2', ChartDir.LR);
const sn1 = new ChartNode('subnode 2', undefined, undefined, 'class1');
const sn2 = new ChartNode('subnode 3');
subgraph2
    .addNode(sn1)
    .addNode(sn2)
    .addLink(new Link(sn1, sn2, 'link between subnodes'));

subgraph.addSubgraph(subgraph2);
chart.addSubgraph(subgraph);

chart.addClassDef(new ClassDef(['class1'], 'fill:#f9f,stroke:#333,stroke-width:2px;'));
chart.addClassDef(new ClassDef(['class2'], new NodeStyle({
    fill: '#300',
    stroke: '#666',
    strokeWidth: '5px',
    color: 'red',
    strokeDasharray: [5, 5]
})));

chart.attachClass(sn2, 'class1');
chart.attachClass(['my-node'], 'class1');
chart.attachClass(node2, 'class2');

chart.addLinkBetween(node1, subgraph2.getId());
chart.addLinkStyle(2, new LinkStyle({
    color: 'green',
    strokeWidth: '2px'
}));

```

## note this is WIP.

still missing
- [ ] sequence graph support
- [ ] either better types or no types. this mix of classes that I ported from python using ChatGPT is not very good.
