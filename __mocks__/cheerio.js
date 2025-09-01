// Mock for cheerio to handle ESM/CJS compatibility issues
const cheerio = {
  load: jest.fn((html) => {
    const $ = jest.fn((selector) => {
      const mockElement = {
        text: jest.fn(() => ''),
        html: jest.fn(() => ''),
        attr: jest.fn(() => ''),
        each: jest.fn((callback) => {
          // Mock iteration over elements
          return mockElement;
        }),
        find: jest.fn(() => mockElement),
        first: jest.fn(() => mockElement),
        last: jest.fn(() => mockElement),
        parent: jest.fn(() => mockElement),
        children: jest.fn(() => mockElement),
        siblings: jest.fn(() => mockElement),
        remove: jest.fn(() => mockElement),
        length: 0,
        toArray: jest.fn(() => []),
      };
      
      // Special handling for common selectors
      if (selector === 'title') {
        mockElement.text.mockReturnValue('Test Title');
      } else if (selector === 'meta[name="description"]') {
        mockElement.attr.mockReturnValue('Test description');
      } else if (selector === 'h1, h2, h3, h4, h5, h6') {
        mockElement.length = 2;
        mockElement.each.mockImplementation((callback) => {
          callback(0, { name: 'h1', children: [{ data: 'Heading 1' }] });
          callback(1, { name: 'h2', children: [{ data: 'Heading 2' }] });
        });
      } else if (selector === 'p, article, section, main') {
        mockElement.text.mockReturnValue('Test content paragraph.');
      }
      
      return mockElement;
    });
    
    $.html = jest.fn(() => html || '<html><body>Test HTML</body></html>');
    $.text = jest.fn(() => 'Test text content');
    $.root = jest.fn(() => $);
    
    return $;
  }),
};

module.exports = cheerio;