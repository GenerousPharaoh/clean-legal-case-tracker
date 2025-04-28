# Migration Guide: From Framer Motion to React Spring

This guide explains how to migrate from framer-motion to react-spring in your application. We've made this change to resolve compatibility issues with MUI components that were causing the `this.events[e].clear is not a function` error.

## Why We Migrated

Framer Motion was causing runtime errors in production when used with MUI components:

```
TypeError: this.events[e].clear is not a function
```

This error occurs because MUI components expect event handlers to have a `clear()` method on their event maps, but the version of framer-motion we were using has internal Map-like objects that lack this method. The error only appears in production builds where the JavaScript is minified and optimized.

## New Animation Utilities

We've created a set of utility components and hooks in `src/utils/useSpringAnimation.js` that provide replacements for framer-motion functionality:

```javascript
import { 
  SpringDiv, 
  SpringSpan, 
  SpringTransition, 
  useSpringAnimation 
} from '@/utils/useSpringAnimation';
```

## Migration Examples

### Basic Animation Component

#### Before (Framer Motion):
```jsx
import { motion } from 'framer-motion';

const MyComponent = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    Content
  </motion.div>
);
```

#### After (React Spring):
```jsx
import { SpringDiv, useSpringAnimation } from '@/utils/useSpringAnimation';

const MyComponent = () => {
  const fadeAnimation = useSpringAnimation('fade');

  return (
    <SpringDiv style={fadeAnimation}>
      Content
    </SpringDiv>
  );
};
```

### Animation With State

#### Before (Framer Motion):
```jsx
import { useState } from 'react';
import { motion } from 'framer-motion';

function MyComponent() {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <motion.div
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    >
      Content
    </motion.div>
  );
}
```

#### After (React Spring):
```jsx
import { useState } from 'react';
import { SpringDiv, useSpring } from '@/utils/useSpringAnimation';

function MyComponent() {
  const [isVisible, setIsVisible] = useState(false);
  
  const springProps = useSpring({
    opacity: isVisible ? 1 : 0,
    config: { tension: 280, friction: 60 }
  });
  
  return <SpringDiv style={springProps}>Content</SpringDiv>;
}
```

### AnimatePresence (Transitions)

#### Before (Framer Motion):
```jsx
import { motion, AnimatePresence } from 'framer-motion';

function MyComponent({ isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          Content
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

#### After (React Spring):
```jsx
import { SpringTransition } from '@/utils/useSpringAnimation';

function MyComponent({ isVisible }) {
  return (
    <SpringTransition
      show={isVisible}
      from={{ opacity: 0, y: 20 }}
      enter={{ opacity: 1, y: 0 }}
      leave={{ opacity: 0, y: -20 }}
    >
      Content
    </SpringTransition>
  );
}
```

## Common Animation Types

Our utility provides several predefined animation types:

```javascript
// Available types: 'fade', 'slideUp', 'slideDown', 'scale', 'rotate'
const fadeAnimation = useSpringAnimation('fade');
const slideAnimation = useSpringAnimation('slideUp');
const scaleAnimation = useSpringAnimation('scale');
```

You can customize these animations by passing options:

```javascript
const customAnimation = useSpringAnimation('slideUp', {
  config: { tension: 200, friction: 20 },
  delay: 300
});
```

## Advanced Usage

For more complex animations, you can use react-spring's native hooks directly:

```javascript
import { useSpring, useSprings, useTrail } from '@/utils/useSpringAnimation';

// Multiple springs
const [springs, api] = useSprings(
  numberOfItems,
  i => ({
    opacity: 1,
    y: 0,
    from: { opacity: 0, y: 50 },
    delay: i * 100
  })
);

// Trails (cascading animations)
const trail = useTrail(numberOfItems, {
  opacity: 1,
  from: { opacity: 0 }
});
```

## Testing Your Migrations

After migrating a component, make sure to test it thoroughly in both development and production environments. Pay special attention to:

1. Animation timing and smoothness
2. Animation behavior on mount/unmount
3. Interactions between animated components

If you encounter any issues or need assistance with complex migrations, please refer to the [React Spring documentation](https://react-spring.dev/) or contact the development team. 