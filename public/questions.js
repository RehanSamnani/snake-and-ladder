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
    {
        id: 2,
        question: "Write a function that returns the sum of two numbers",
        functionName: "addNumbers",
        testCases: [
            { input: [5, 3], expected: 8 },
            { input: [10, -5], expected: 5 },
            { input: [0, 0], expected: 0 }
        ],
        templates: {
            python: "def addNumbers(a, b):\n    # Write your code here\n    pass",
            java: "public class Solution {\n    public static int addNumbers(int a, int b) {\n        // Write your code here\n        return 0;\n    }\n}",
            c: "int addNumbers(int a, int b) {\n    // Write your code here\n    return 0;\n}"
        },
        solutions: {
            python: "def addNumbers(a, b):\n    return a + b",
            java: "public class Solution {\n    public static int addNumbers(int a, int b) {\n        return a + b;\n    }\n}",
            c: "int addNumbers(int a, int b) {\n    return a + b;\n}"
        }
    },
    {
        id: 3,
        question: "Write a function that checks if a number is even or odd",
        functionName: "isEven",
        testCases: [
            { input: [6], expected: true },
            { input: [7], expected: false },
            { input: [0], expected: true }
        ],
        templates: {
            python: "def isEven(n):\n    # Write your code here\n    pass",
            java: "public class Solution {\n    public static boolean isEven(int n) {\n        // Write your code here\n        return false;\n    }\n}",
            c: "int isEven(int n) {\n    // Write your code here\n    // Return 1 for true, 0 for false\n    return 0;\n}"
        },
        solutions: {
            python: "def isEven(n):\n    return n % 2 == 0",
            java: "public class Solution {\n    public static boolean isEven(int n) {\n        return n % 2 == 0;\n    }\n}",
            c: "int isEven(int n) {\n    return n % 2 == 0;\n}"
        }
    },
    {
        id: 4,
        question: "Write a program to find the factorial of a number (n=5)",
        solutions: {
            python: 'def factorial(n):\n    return 1 if n <= 1 else n * factorial(n-1)\nprint(factorial(5))',
            java: 'class Main {\n    static int factorial(int n) {\n        return n <= 1 ? 1 : n * factorial(n-1);\n    }\n    public static void main(String[] args) {\n        System.out.println(factorial(5));\n    }\n}',
            c: '#include <stdio.h>\nint factorial(int n) {\n    return n <= 1 ? 1 : n * factorial(n-1);\n}\nint main() {\n    printf("%d", factorial(5));\n    return 0;\n}'
        }
    },
    {
        id: 5,
        question: "Write a program to check if a string is palindrome (s='radar')",
        solutions: {
            python: 's = "radar"\nprint("Palindrome" if s == s[::-1] else "Not Palindrome")',
            java: 'class Main {\n    public static void main(String[] args) {\n        String s = "radar";\n        String rev = new StringBuilder(s).reverse().toString();\n        System.out.println(s.equals(rev) ? "Palindrome" : "Not Palindrome");\n    }\n}',
            c: '#include <stdio.h>\n#include <string.h>\nint main() {\n    char s[] = "radar";\n    int i, len = strlen(s);\n    int isPalindrome = 1;\n    for(i = 0; i < len/2; i++) {\n        if(s[i] != s[len-1-i]) {\n            isPalindrome = 0;\n            break;\n        }\n    }\n    printf("%s", isPalindrome ? "Palindrome" : "Not Palindrome");\n    return 0;\n}'
        }
    }
]; 