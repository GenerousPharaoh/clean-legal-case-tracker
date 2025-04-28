// Polyfill for Map.clear in environments where it might be missing
if (typeof Map !== 'undefined' && !Map.prototype.clear) {
  console.info('Adding Map.clear polyfill for compatibility');
  Map.prototype.clear = function() {
    this.forEach((_, key) => {
      this.delete(key);
    });
    return this;
  };
}
