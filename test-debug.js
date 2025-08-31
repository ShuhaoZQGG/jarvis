const { render, screen, fireEvent, waitFor } = require('@testing-library/react');

// Test the regex pattern
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

console.log('Testing email validation regex:');
console.log('notanemail:', emailPattern.test('notanemail')); // Should be false
console.log('test@example.com:', emailPattern.test('test@example.com')); // Should be true
console.log('test@:', emailPattern.test('test@')); // Should be false
console.log('@example.com:', emailPattern.test('@example.com')); // Should be false
