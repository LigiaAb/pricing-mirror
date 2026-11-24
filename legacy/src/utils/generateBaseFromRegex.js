const generatePlaceholderFromRegex = (regexPattern) => {
  // Convertir el patrón regex a string si es un objeto RegExp
  const pattern = typeof regexPattern === "string" ? regexPattern : regexPattern.source;

  let result = "";
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];

    // Escapar caracteres especiales literales
    if (char === "\\") {
      i++;
      if (i >= pattern.length) break;

      const nextChar = pattern[i];
      switch (nextChar) {
        case "d":
          result += "0"; // Dígito
          break;
        case "w":
          result += "a"; // Carácter alfanumérico
          break;
        case "s":
          result += " "; // Espacio
          break;
        case "D":
          result += "a"; // No dígito
          break;
        case "W":
          result += "!"; // No alfanumérico
          break;
        case "S":
          result += "a"; // No espacio
          break;
        default:
          result += nextChar; // Carácter escapado literal
      }
      i++;
    }
    // Clases de caracteres [abc]
    else if (char === "[") {
      const endBracket = pattern.indexOf("]", i);
      if (endBracket === -1) {
        result += "[";
        i++;
        continue;
      }

      const classContent = pattern.substring(i + 1, endBracket);
      // Simplificación: tomar el primer carácter válido de la clase
      if (classContent.startsWith("^")) {
        // Clase negada - usar un carácter que no esté en la clase
        result += "x";
      } else if (classContent.includes("-")) {
        // Rango como a-z
        const rangeMatch = classContent.match(/([a-zA-Z0-9])-([a-zA-Z0-9])/);
        if (rangeMatch) {
          result += rangeMatch[1]; // Primer carácter del rango
        } else {
          result += classContent[0] || "a";
        }
      } else {
        result += classContent[0] || "a";
      }
      i = endBracket + 1;
    }
    // Cuantificadores: {n}, {n,}, {n,m}
    else if (char === "{") {
      const endBrace = pattern.indexOf("}", i);
      if (endBrace === -1) {
        result += "{";
        i++;
        continue;
      }

      const quantifier = pattern.substring(i + 1, endBrace);
      const quantMatch = quantifier.match(/(\d+)(?:,(\d+)?)?/);

      if (quantMatch) {
        const min = parseInt(quantMatch[1]);
        const max = quantMatch[2] ? parseInt(quantMatch[2]) : min;

        // Repetir el último carácter generado
        const lastChar = result[result.length - 1] || "a";
        const repeatCount = isNaN(max) ? min : Math.min(min, max);

        // Ya tenemos un carácter, añadimos (repeatCount - 1) más
        result += lastChar.repeat(repeatCount - 1);
      }
      i = endBrace + 1;
    }
    // Caracteres especiales con significado
    else if (char === ".") {
      result += "a"; // Cualquier carácter
      i++;
    } else if (char === "?") {
      // ? significa 0 o 1 - ya tenemos 1, no hacemos nada
      i++;
    } else if (char === "*") {
      // * significa 0 o más - añadimos algunos caracteres
      const lastChar = result[result.length - 1] || "a";
      result += lastChar.repeat(2); // Añadimos 2 más
      i++;
    } else if (char === "+") {
      // + significa 1 o más - ya tenemos 1, añadimos más
      const lastChar = result[result.length - 1] || "a";
      result += lastChar.repeat(2); // Añadimos 2 más
      i++;
    } else if (char === "(") {
      // Grupo de captura - ignoramos para el placeholder
      const endParen = pattern.indexOf(")", i);
      if (endParen === -1) {
        result += "(";
        i++;
        continue;
      }

      const groupContent = pattern.substring(i + 1, endParen);
      // Procesar el contenido del grupo recursivamente
      const groupResult = generatePlaceholderFromRegex(groupContent);
      result += groupResult;

      i = endParen + 1;
    } else if (char === "|") {
      // Alternativa - tomar la primera opción (ya procesada)
      // Saltamos al final de la alternativa
      const nextPipe = pattern.indexOf("|", i + 1);
      const endParen = pattern.indexOf(")", i);

      if (nextPipe !== -1 && nextPipe < endParen) {
        i = nextPipe + 1;
      } else if (endParen !== -1) {
        i = endParen + 1;
      } else {
        i++;
      }
    } else if (char === "^" || char === "$") {
      // Anclas de inicio/fin - ignorar
      i++;
    } else {
      // Carácter literal
      result += char;
      i++;
    }
  }

  return result || "ejemplo";
};

export default generatePlaceholderFromRegex;
