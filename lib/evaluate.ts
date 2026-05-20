/** Safe evaluation for a basic CS-101 calculator (+, -, *, /, decimals). */
export function evaluate(expression: string): number {
  const cleaned = expression.replace(/\s/g, "").replace(/×/g, "*").replace(/÷/g, "/");
  if (!cleaned || !/^[\d+\-*/.()]+$/.test(cleaned)) {
    throw new Error("Invalid expression");
  }

  const tokens: string[] = [];
  let num = "";
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if ((ch >= "0" && ch <= "9") || ch === ".") {
      num += ch;
    } else {
      if (num) {
        tokens.push(num);
        num = "";
      }
      tokens.push(ch);
    }
  }
  if (num) tokens.push(num);

  const output: string[] = [];
  const ops: string[] = [];
  const prec: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

  for (const t of tokens) {
    if (!isNaN(Number(t))) {
      output.push(t);
    } else if (t === "(") {
      ops.push(t);
    } else if (t === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") {
        output.push(ops.pop()!);
      }
      ops.pop();
    } else {
      while (ops.length && ops[ops.length - 1] !== "(" && prec[ops[ops.length - 1]] >= prec[t]) {
        output.push(ops.pop()!);
      }
      ops.push(t);
    }
  }
  while (ops.length) output.push(ops.pop()!);

  const stack: number[] = [];
  for (const t of output) {
    if (!isNaN(Number(t))) {
      stack.push(Number(t));
    } else {
      const b = stack.pop()!;
      const a = stack.pop()!;
      switch (t) {
        case "+":
          stack.push(a + b);
          break;
        case "-":
          stack.push(a - b);
          break;
        case "*":
          stack.push(a * b);
          break;
        case "/":
          if (b === 0) throw new Error("Division by zero");
          stack.push(a / b);
          break;
      }
    }
  }

  if (stack.length !== 1) throw new Error("Invalid expression");
  return stack[0];
}
