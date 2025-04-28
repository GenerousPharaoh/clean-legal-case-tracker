# React Timeout Management

This directory contains utilities to fix common timeout-related issues in React applications.

## Issues Fixed

The utilities in this directory address the following issues:

1. **"Cannot set property clear of #\<Object\> which has only a getter" errors** - This often happens with libraries like Material UI, React Redux, and others that use timeouts internally
2. **Memory leaks from timeouts in unmounted components** - Prevents the "Can't perform a React state update on an unmounted component" warning
3. **Infinite recursion in timeout handling** - Prevents maximum call stack exceeded errors

## How to Use

### 1. Import the fixes in your main entry file

```jsx
// In src/index.js or App.jsx at the very top
import './utils/reactTimeoutFixes';
import './utils/reactTimeoutPatch';
```

### 2. Use the React hooks in your components

#### For simple usage:

```jsx
import { useSafeTimeout } from './utils/reactTimeoutFixes';

function MyComponent() {
  const { setTimeout, clearTimeout } = useSafeTimeout();
  
  const handleClick = () => {
    setTimeout(() => {
      console.log('This is safe even if the component unmounts!');
    }, 1000);
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

#### For components like modals/dialogs that might close before a timeout completes:

```jsx
import { useComponentTimeout } from './utils/reactTimeoutFixes';

function Modal({ isOpen, onClose }) {
  const { setTimeout } = useComponentTimeout();
  
  const handleAutoClose = () => {
    setTimeout(() => {
      onClose();
    }, 5000);
  };
  
  // All timeouts are automatically cleared if the modal unmounts
  
  return (
    isOpen && (
      <div className="modal">
        <button onClick={handleAutoClose}>Auto-close in 5 seconds</button>
      </div>
    )
  );
}
```

### 3. For Material UI components with click effects

When using Material UI components that have click effects, you can make them safer:

```jsx
import Button from '@mui/material/Button';
import { useComponentTimeout } from './utils/reactTimeoutFixes';

function SafeButton(props) {
  const { setTimeout } = useComponentTimeout();
  const [active, setActive] = useState(false);
  
  const handleClick = (e) => {
    setActive(true);
    setTimeout(() => setActive(false), 250);
    
    if (props.onClick) {
      props.onClick(e);
    }
  };
  
  return (
    <Button 
      {...props}
      className={`${active ? 'active' : ''} ${props.className || ''}`}
      onClick={handleClick} 
    />
  );
}
```

## Troubleshooting

If you're still encountering timeout-related issues:

1. Make sure the fixes are imported at the top of your entry file
2. Check if you're using any libraries not covered by these fixes
3. For Material UI specific issues, check for version compatibility (works with v5+)

## Advanced: Manual Timeout Object Patching

For objects created by third-party libraries, you can manually patch them:

```js
import { useEffect, useRef } from 'react';

function MyComponent() {
  const someTimeoutObject = useRef(null);
  
  useEffect(() => {
    // Create a timeout object from a library
    someTimeoutObject.current = someLibrary.createTimeout();
    
    // Patch it to be safe
    if (window.__reactSafeTimeout) {
      someTimeoutObject.current = window.__reactSafeTimeout.fixTimeoutObject(someTimeoutObject.current);
    }
    
    return () => {
      // Now it's safe to call clear even if it had a getter-only property
      if (someTimeoutObject.current) {
        someTimeoutObject.current.clear();
      }
    };
  }, []);
  
  // ...
}
``` 