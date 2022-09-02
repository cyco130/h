// Convince TypeScript that this is a module
export {};

// This is our JSX factory, like createElement
function h(type: any, props: any, ...children: any) {
  return { type, props, children };
}

// Tell the tooling to use our custom JSX factory
// @jsx h

// A few global types to make TypeScript happy
declare global {
  namespace JSX {
    type Element = {
      type: string | Function;
      props: Record<string, string>;
      children: any;
    };
    type IntrinsicElements = Record<string, any>;
  }
}

function escapeHtmlText(s: string) {
  // Ampersand must be escaped first, otherwise it will escape the other entities!
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtmlAttr(s: string) {
  // Ampersand must be escaped first, otherwise it will escape the other entities!
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Our render function in the form of an async generator
async function* render(
  node: JSX.Element | string | number | null | undefined
): AsyncIterable<string> {
  switch (typeof node) {
    case "number":
      yield String(node);
      return;
    case "string":
      yield escapeHtmlText(node);
      return;
    case "object":
      if (node === null) {
        return;
      }

      if (Array.isArray(node)) {
        for (const child of node) {
          yield* render(child);
        }
        return;
      }

      const { type, props, children } = node;
      if (typeof type === "string") {
        yield `<${type}`;
        for (const [key, value] of Object.entries(props)) {
          yield ` ${key}="${escapeHtmlAttr(value)}"`;
        }
        yield ">";
        yield* render(children);
        yield `</${type}>`;
        return;
      } else {
        yield* render(type({ ...props, children }));
      }
    case "boolean":
    case "undefined":
      return;
    default:
      throw new Error("Unknown node type");
  }
}

// Let's test it!
const App = () => <div id="hello">Hello world!</div>;

const output = render(<App />);

for await (const chunk of output) {
  process.stdout.write(chunk);
  // Wait a little so we can see the output streaming
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

console.log();
