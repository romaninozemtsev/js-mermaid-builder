enum ChartDir {
    LR = "LR",
    TD = "TD",
    TB = "TB",
    RL = "RL",
    BT = "BT",
}

enum NodeShape {
    RECT_ROUND = "(VAL)",
    STADIUM = "([VAL])",
    SUBROUTINE = "[[VAL]]",
    CYLINDER = "[(VAL)]",
    CIRCLE = "((VAL))",
    ASSYMETRIC = ">VAL]",
    RHOMBUS = "{VAL}",
    HEXAGON = "{{VAL}}",
}

enum LinkType {
    ARROW = "-->",
    OPEN = "---",
    INVISIBLE = "~~~",
}

interface INodeStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: string;
    color?: string;
    strokeDasharray?: string | number[];
}

class NodeStyle implements INodeStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: string;
    color?: string;
    strokeDasharray?: string | number[];

    constructor({ fill, stroke, strokeWidth, color, strokeDasharray }: INodeStyle) {
        this.fill = fill;
        this.stroke = stroke;
        this.strokeWidth = strokeWidth;
        this.color = color;
        this.strokeDasharray = strokeDasharray;
    }

    toString(): string {
        const result: string[] = [];
        if (this.fill) result.push(`fill:${this.fill}`);
        if (this.stroke) result.push(`stroke:${this.stroke}`);
        if (this.strokeWidth) result.push(`stroke-width:${this.strokeWidth}`);
        if (this.color) result.push(`color:${this.color}`);
        let strokeDasharray = '';
        if (this.strokeDasharray) {
            if (Array.isArray(this.strokeDasharray)) {
                strokeDasharray = this.strokeDasharray.join(' ');
            } else {
                strokeDasharray = this.strokeDasharray;
            }
            result.push(`stroke-dasharray:${strokeDasharray}`);
        }
        return result.join(',');
    }
}

class ChartNode {
    title: string;
    shape: NodeShape;
    id: string;
    className?: string;

    constructor(title = '', shape = NodeShape.RECT_ROUND, id = '', className?: string) {
        this.title = title;
        this.shape = shape;
        this.id = id;
        this.className = className;
    }

    private ensureId(): void {
        if (!this.id && this.title) {
            this.id = this.title.replace(/[^a-zA-Z0-9\-_!#$]+/g, '');
        }
    }

    getId(): string {
        this.ensureId();
        return this.id;
    }

    toString(): string {
        this.ensureId();
        const classNameSuffix = this.className ? `:::${this.className}` : '';
        return `${this.id}${this.shape.replace('VAL', this.title)}${classNameSuffix}`;
    }
}

interface ILinkStyle {
    stroke?: string;
    strokeWidth?: string;
    color?: string;
}

class LinkStyle implements ILinkStyle {
    stroke?: string;
    strokeWidth?: string;
    color?: string;

    constructor({ stroke, strokeWidth, color }: ILinkStyle) {
        this.stroke = stroke;
        this.strokeWidth = strokeWidth;
        this.color = color;
    }

    toString(): string {
        const result: string[] = [];
        if (this.stroke) result.push(`stroke:${this.stroke}`);
        if (this.strokeWidth) result.push(`stroke-width:${this.strokeWidth}`);
        if (this.color) result.push(`color:${this.color}`);
        return result.join(',');
    }
}

class Link {
    src: string | ChartNode;
    dest: string | ChartNode;
    text?: string;
    type: LinkType;
    style?: string | LinkStyle;

    constructor(src: string | ChartNode, dest: string | ChartNode, text?: string, type = LinkType.ARROW, style?: string | LinkStyle) {
        this.src = src;
        this.dest = dest;
        this.text = text;
        this.type = type;
        this.style = style;
    }

    toString(): string {
        const srcId = typeof this.src === 'string' ? this.src : this.src.getId();
        const destId = typeof this.dest === 'string' ? this.dest : this.dest.getId();
        const linkText = this.text ? `|${this.text}|` : '';
        return `${srcId} ${this.type} ${linkText}${destId}`;
    }

    printStyle(linkCount: number): string {
        if (!this.style) {
            return '';
        }
        const style = typeof this.style === 'string' ? this.style : this.style.toString();
        return `linkStyle ${linkCount} ${style};`;
    }
}

class ClassDef {
    classNames: string | string[];
    style: string | NodeStyle;

    constructor(classNames: string | string[], style: string | NodeStyle) {
        this.classNames = classNames;
        this.style = style;
    }

    toString(): string {
        const classNames = Array.isArray(this.classNames) ? this.classNames.join(',') : this.classNames;
        return `classDef ${classNames} ${this.style.toString()}`;
    }
}

class ClassAttachment {
    nodes: string | ChartNode | (string | ChartNode)[];
    className: string;

    constructor(nodes: string | ChartNode | (string | ChartNode)[], className: string) {
        this.nodes = nodes;
        this.className = className;
    }

    toString(): string {
        let nodesArray: string[];
        if (typeof this.nodes === 'string') {
            nodesArray = [this.nodes];
        } else if (this.nodes instanceof ChartNode) {
            nodesArray = [this.nodes.getId()];
        } else {
            nodesArray = this.nodes.map((node: string | ChartNode) => (typeof node === 'string' ? node : node.getId()));
        }
        return `class ${nodesArray.join(',')} ${this.className};`;
    }
}

class Chart {
    title?: string;
    direction: ChartDir;
    nodes: ChartNode[];
    links: Link[];
    subgraphs: Subgraph[];
    classDefs: ClassDef[];
    classAttachments: ClassAttachment[];
    positionalLinkStyles: [number, string | LinkStyle][];

    constructor(title?: string, direction = ChartDir.TD) {
        this.title = title;
        this.direction = direction;
        this.nodes = [];
        this.links = [];
        this.subgraphs = [];
        this.classDefs = [];
        this.classAttachments = [];
        this.positionalLinkStyles = [];
    }

    toString(): string {
        return this.print('', 0).text;
    }

    protected printBody(indent: string, linkCount: number): { text: string; nextLinkCount: number } {
        const result: string[] = [];
        let currentLinkCount = linkCount;
        for (const node of this.nodes) {
            result.push(indent + node.toString());
        }
        for (const link of this.links) {
            result.push(indent + link.toString());
            if (link.style) {
                result.push(indent + link.printStyle(currentLinkCount));
            }
            currentLinkCount += 1;
        }
        for (const subgraph of this.subgraphs) {
            const subgraphResult = subgraph.print(indent, currentLinkCount);
            result.push(subgraphResult.text);
            currentLinkCount = subgraphResult.nextLinkCount;
        }
        for (const classDef of this.classDefs) {
            result.push(indent + classDef.toString());
        }
        for (const classAttachment of this.classAttachments) {
            result.push(indent + classAttachment.toString());
        }
        for (const [linkPos, style] of this.positionalLinkStyles) {
            const normalizedStyle = typeof style === 'string' ? style : style.toString();
            result.push(indent + `linkStyle ${linkPos} ${normalizedStyle};`);
        }
        return { text: result.join('\n'), nextLinkCount: currentLinkCount };
    }

    print(indent: string, linkCount: number): { text: string; nextLinkCount: number } {
        const currentIndent = indent;
        const result: string[] = [];
        if (this.title) {
            result.push(`${currentIndent}---`);
            result.push(`${currentIndent}title: ${this.title}`);
            result.push(`${currentIndent}---`);
        }
        result.push(`${currentIndent}flowchart ${this.direction}`);
        const body = this.printBody(currentIndent + '  ', linkCount);
        result.push(body.text);
        result.push('');
        return { text: result.join('\n'), nextLinkCount: body.nextLinkCount };
    }

    addNode(node: ChartNode | string): this {
        if (typeof node === 'string') {
            node = new ChartNode(node);
        }
        this.nodes.push(node);
        return this;
    }

    addNodes(nodes: ChartNode[]): this {
        this.nodes.push(...nodes);
        return this;
    }

    addLink(link: Link): this {
        this.links.push(link);
        return this;
    }

    addClassDef(classDef: ClassDef): this {
        this.classDefs.push(classDef);
        return this;
    }

    attachClass(nodes: string | ChartNode | (string | ChartNode)[], className: string): this {
        this.classAttachments.push(new ClassAttachment(nodes, className));
        return this;
    }

    addLinkBetween(src: string | ChartNode, dest: string | ChartNode, text?: string): this {
        const srcId = typeof src === 'string' ? src : src.getId();
        const destId = typeof dest === 'string' ? dest : dest.getId();
        this.addLink(new Link(srcId, destId, text));
        return this;
    }

    addLinkStyle(link: number | Link, style: string | LinkStyle): this {
        if (link instanceof Link) {
            link.style = style;
        } else {
            this.positionalLinkStyles.push([link, style]);
        }
        return this;
    }

    addSubgraph(subgraph: Subgraph): this {
        this.subgraphs.push(subgraph);
        return this;
    }
}

class Subgraph extends Chart {
    id?: string;

    toString(): string {
        return this.print('', 0).text;
    }

    getId(): string {
        if (!this.id) {
            this.id = this.title ? this.title.replace(/[^a-zA-Z0-9\-_]+/g, '') : 'subgraph' + Math.floor(Math.random() * 1000000);
        }
        return this.id;
    }

    print(indent: string, linkCount: number): { text: string; nextLinkCount: number } {
        const currentIndent = indent;
        const result: string[] = [];
        result.push(`${currentIndent}subgraph ${this.getId()} [${this.title || ''}]`);
        result.push(`${currentIndent}  direction ${this.direction}`);
        const body = this.printBody(currentIndent + '  ', linkCount);
        result.push(body.text);
        result.push(`${indent}end`);
        return { text: result.join('\n'), nextLinkCount: body.nextLinkCount };
    }
}

export { Chart, ChartNode, Link, LinkType, LinkStyle, NodeStyle, NodeShape, ChartDir, Subgraph, ClassDef, ClassAttachment };
