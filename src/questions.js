const questions = [
    {
        id: 1,
        question: "Write a function that returns 'Hello World'",
        functionName: "sayHello",
        testCases: [
            { input: [], expected: "Hello World" }
        ],
        templates: {
            python: "def sayHello():\n    # Write your code here\n    pass",
            java: "public class Solution {\n    public static String sayHello() {\n        // Write your code here\n        return \"\";\n    }\n}",
            c: "#include <stdio.h>\n#include <string.h>\n\nchar* sayHello() {\n    // Write your code here\n    static char result[20];\n    return result;\n}"
        },
        solutions: {
            python: "def sayHello():\n    return \"Hello World\"",
            java: "public class Solution {\n    public static String sayHello() {\n        return \"Hello World\";\n    }\n}",
            c: "#include <stdio.h>\n#include <string.h>\n\nchar* sayHello() {\n    static char result[20] = \"Hello World\";\n    return result;\n}"
        }
    },
    // ... add more questions ...
];

module.exports = questions; 