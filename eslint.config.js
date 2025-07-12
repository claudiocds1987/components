// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
    {
        files: ["**/*.ts"],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
            ...tseslint.configs.stylistic,
            ...angular.configs.tsRecommended,
        ],
        processor: angular.processInlineTemplates,
        rules: {
            "@angular-eslint/directive-selector": [
                "error",
                {
                    type: "attribute",
                    prefix: "app",
                    style: "camelCase",
                },
            ],
            "@angular-eslint/component-selector": [
                "error",
                {
                    type: "element",
                    prefix: "app",
                    style: "kebab-case",
                },
            ],
            semi: ["error", "always"],
            quotes: ["error", "double"],

            // ✅ Orden de miembros: públicos antes que privados
            "@typescript-eslint/member-ordering": [
                "error",
                {
                    default: [
                        "signature",

                        "public-static-field",
                        "protected-static-field",
                        "private-static-field",

                        "public-instance-field",
                        "protected-instance-field",
                        "private-instance-field",

                        "public-constructor",
                        "protected-constructor",
                        "private-constructor",

                        "public-static-method",
                        "protected-static-method",
                        "private-static-method",

                        "public-instance-method",
                        "protected-instance-method",
                        "private-instance-method",
                    ],
                },
            ],

            // ✅ Tipado obligatorio en funciones
            "@typescript-eslint/explicit-function-return-type": [
                "error",
                {
                    allowExpressions: false,
                    allowTypedFunctionExpressions: false,
                    allowHigherOrderFunctions: false,
                    allowDirectConstAssertionInArrowFunctions: false,
                },
            ],
        },
    },
    {
        files: ["**/*.html"],
        extends: [
            ...angular.configs.templateRecommended,
            ...angular.configs.templateAccessibility,
        ],
        rules: {},
    },
);
