// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const tailwind = require('eslint-plugin-tailwindcss')
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended')
const eslintConfigPrettier = require('eslint-config-prettier/flat')

module.exports = defineConfig([
    expoConfig,
    {
        files: ['**/*.{ts,tsx}'], // 明确要检查的文件类型
        ignores: ['dist/*'],
        languageOptions: {
            parserOptions: {
                ecmaVersion: 'latest', // 或具体版本号如 2022
                sourceType: 'module', // 启用 ES 模块
            },
        },
        // 插件配置
        plugins: {
            'react-native': require('eslint-plugin-react-native'),
            'react-hooks': require('eslint-plugin-react-hooks'),
        },

        // 规则配置
        rules: {
            // 核心规则：禁止裸文本，必须包裹在<Text>中
            'react-native/no-raw-text': 'error',

            // 其他React Native推荐规则（可选）
            'react-native/no-unused-styles': 'warn', // 检测未使用的样式
            'react-native/no-inline-styles': 'warn', // 不推荐内联样式
            'react-native/split-platform-components': 'error', // 规范平台特定组件
            'react/jsx-key': 'error',

            // React Hook 规则
            'react-hooks/rules-of-hooks': 'error', // 强制 Hook 使用规则
            'react-hooks/exhaustive-deps': 'warn', // 检查依赖数组

            // 允许普通函数作为组件
            'react/function-component-definition': [
                'error',
                {
                    namedComponents: 'function-declaration', // 命名组件使用 function 关键字
                    unnamedComponents: 'arrow-function', // 未命名组件使用箭头函数
                },
            ],
            'react/no-unstable-nested-components': 'error',
            'tailwindcss/classnames-order': 'off',
        },
        // 设置React版本（帮助eslint-plugin-react正确工作）
        settings: {
            react: {
                version: 'detect', // 自动检测React版本
                componentWrapperFunctions: ['React.memo', 'React.forwardRef'],
            },
        },
    },
    ...tailwind.configs['flat/recommended'],
    eslintPluginPrettierRecommended,
    eslintConfigPrettier,
    {
        ignores: ['app.config.js', '.expo', 'drizzle', './*.d.ts'],
    },
])
