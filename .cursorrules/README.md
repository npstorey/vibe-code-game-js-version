# Cursor Rules for Vibe Coding Simulator

This directory contains cursor rules that guide AI assistants in aligning the Vibe Coding Simulator with design and functionality requirements.

## Rules Files Overview

- **rules.yml**: Core structural and layout rules based on the target design
- **component_rules.yml**: Component-specific functionality rules
- **ui_rules.yml**: UI enhancement rules for improved visual feedback and animations
- **game_balance.yml**: Game balance and content rules for meaningful progression
- **code_quality.yml**: Code quality standards for maintainability and best practices

## Purpose

These rules help ensure:

1. **Visual Consistency**: UI components match the target design
2. **Functional Completeness**: Core game mechanics are properly implemented
3. **Code Quality**: Components are properly structured and follow best practices
4. **Game Balance**: The gameplay experience provides meaningful progression and challenge
5. **Maintainability**: Code follows best practices for structure, typing, and documentation

## How to Use

When working with an AI assistant on this codebase:

1. The AI will automatically apply these rules when analyzing or modifying relevant files
2. Rules are matched to files via glob patterns, ensuring targeted guidance
3. Rules contain detailed prompts explaining the expected behavior/implementation

## Extending Rules

To add new cursor rules:

1. Add them to the appropriate .yml file based on their category
2. Follow the existing format with a clear prompt and specific glob pattern
3. Include detailed guidance that explains not just what to implement but why

## Priority

When rules conflict, the priority should be:

1. Functional correctness (game mechanics must work correctly)
2. Visual alignment with target designs
3. Performance optimizations and enhanced UX
4. Code structure and maintainability 