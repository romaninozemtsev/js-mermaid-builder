import { Chart, ClassDef, LinkStyle, ChartNode, Link, NodeStyle, Subgraph, NodeShape, ChartDir } from '../index';

describe('Chart Tests', () => {
    test('OOP Style', () => {
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
        // @ts-ignore
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
        // @ts-ignore
        chart.addClassDef(new ClassDef(['class2'], new NodeStyle({
            fill: '#300',
            stroke: '#666',
            strokeWidth: '5px',
            color: 'red',
            strokeDasharray: [5, 5]
        })));

        // @ts-ignore
        chart.attachClass(sn2, 'class1');
        chart.attachClass(['my-node'], 'class1');
        chart.attachClass(node2, 'class2');

        // @ts-ignore
        chart.addLinkBetween(node1, subgraph2.getId());
        // @ts-ignore
        chart.addLinkStyle(2, new LinkStyle({
            color: 'green',
            strokeWidth: '2px'
        }));

        const expected = `---
title: Test
---
flowchart TB
  my-node{{this is my node}}
  thisismysecondnode(this is my second node)
  my-node --> |this is my link|thisismysecondnode
  linkStyle 0 stroke-width:2px,color:red;
  my-node --> subgraph2
  subgraph MySubgraph [My Subgraph]
    direction LR
    iamanodeinsidesubgraph(i am a node inside subgraph)
    subgraph subgraph2 [subgraph2]
      direction LR
      subnode2(subnode 2):::class1
      subnode3(subnode 3)
      subnode2 --> |link between subnodes|subnode3
    end
  end
  classDef class1 fill:#f9f,stroke:#333,stroke-width:2px;
  classDef class2 fill:#300,stroke:#666,stroke-width:5px,color:red,stroke-dasharray:5 5
  class subnode3 class1;
  class my-node class1;
  class thisismysecondnode class2;
  linkStyle 2 stroke-width:2px,color:green;
`;

        expect(chart.toString()).toBe(expected);
    });

    test('Quick Style', () => {
        const chart = new Chart('test1')
            .addNode('user')
            .addNode('client')
            .addNode('server')
            .addNode('database')
            .addLinkBetween('user', 'client')
            .addLinkBetween('client', 'server')
            .addLinkBetween('server', 'database');

        const expected = `---
title: test1
---
flowchart TD
  user(user)
  client(client)
  server(server)
  database(database)
  user --> client
  client --> server
  server --> database
`;
  
          expect(chart.toString()).toBe(expected);
      });
});