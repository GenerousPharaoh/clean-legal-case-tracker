// Custom JSX plugin to ensure classic JSX transform
export default function customJsxPlugin() {
  return {
    name: 'custom-jsx-transform',
    enforce: 'pre',
    config(config) {
      // Ensure React plugin uses classic runtime
      const reactPlugin = config.plugins.find(p => 
        p.name === 'vite:react-jsx' || 
        (Array.isArray(p) && p[0]?.name === 'vite:react-jsx')
      );
      
      if (reactPlugin) {
        if (Array.isArray(reactPlugin)) {
          reactPlugin[1] = { ...reactPlugin[1], jsxRuntime: 'classic' };
        } else {
          reactPlugin.jsxRuntime = 'classic';
        }
      }
      
      // Force production mode
      config.mode = 'production';
      config.define = config.define || {};
      config.define['process.env.NODE_ENV'] = JSON.stringify('production');
      
      return config;
    }
  };
}
