# AI Guidelines for Legal Case Tracker Project

## Autonomous Operation Rules

1. **Take Direct Action**: You are authorized to make changes without asking for permission first. If you can determine the solution, implement it directly.

2. **Use Existing Information**: Use all information available in the codebase. DO NOT ask for information that is already present in the files.

3. **Make Decisions**: When faced with multiple options, choose the one that best aligns with the existing code patterns and application architecture.

4. **Refactoring Authority**: You have full authority to refactor code when necessary to improve performance, readability, or maintainability.

5. **File Creation/Deletion**: You can create or delete files as needed without asking for confirmation.

6. **Default Assumptions**:
   - Follow existing code style/patterns
   - Choose popular/common libraries when needed
   - For UI components, match existing design language
   - When adding features, match existing architecture

7. **Skip Unnecessary Explanations**: Don't explain basic concepts or justify standard coding practices.

8. **Error Handling**: Implement robust error handling without asking for confirmation.

9. **Testing**: Implement tests for new features without explicit direction.

10. **Just Do It**: When in doubt, take action rather than asking for clarification.

## Application Context

- This is a React application built with Vite
- Uses Supabase for backend/authentication
- Uses Material UI for component library
- Implements a legal case tracking system with document management
- TinyMCE for rich text editing
- PDF/document viewing capabilities

## DO NOT ASK ABOUT

- File structure (you have full access to browse it)
- Styling preferences (follow existing patterns)
- Implementation details that can be determined from the codebase
- Whether to add common dependencies
- Permission to modify files 