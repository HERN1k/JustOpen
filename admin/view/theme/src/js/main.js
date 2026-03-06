// Developed by HERN1k


/**
 * JSDoc комментарий
 */
async function testMinifier(data) {
    const user = data?.profile?.name ?? "Anonymous"; // Optional chaining & Nullish coalescing

    const longVariableNameWithManyCharacters = 42;
    
    // Лишние пробелы и табуляции
    if    (  longVariableNameWithManyCharacters    === 42  ) {
        console.log("Result:", user);
    }

    const unusedVariable = "I should be removed if dead code elimination works";

    const arrowFunc = async (a, b) => {
        return await Promise.resolve(a + b);
    };

    /* FIXME: Удалить этот консоль в продакшене */
    console.log(`Template literal test: ${user}`);
    
    return arrowFunc(10, 20);
}

// Вызов функции с кучей пробелов в конце
testMinifier({ profile: { name: "Vlad" } })   ;