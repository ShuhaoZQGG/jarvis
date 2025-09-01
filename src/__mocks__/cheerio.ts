// Mock implementation of Cheerio for testing
const cheerio = {
  load: jest.fn((html: string) => {
    const $ = (selector: string) => {
      const mockElement = {
        text: jest.fn(() => ''),
        html: jest.fn(() => ''),
        attr: jest.fn(() => ''),
        find: jest.fn(() => mockElement),
        each: jest.fn((callback: Function) => {
          // Mock iteration over elements
          return mockElement;
        }),
        toArray: jest.fn(() => []),
        length: 0,
      };
      
      // Basic selector mocking
      if (selector === 'title') {
        mockElement.text = jest.fn(() => 'Test Page Title');
      } else if (selector === 'meta[name="description"]') {
        mockElement.attr = jest.fn((attr) => {
          if (attr === 'content') return 'Test description';
          return '';
        });
      } else if (selector === 'meta[name="keywords"]') {
        mockElement.attr = jest.fn((attr) => {
          if (attr === 'content') return 'test, keywords';
          return '';
        });
      } else if (selector === 'h1, h2, h3, h4, h5, h6') {
        mockElement.each = jest.fn((callback: Function) => {
          callback(0, { 
            name: 'h1',
            children: [{ data: 'Test Heading' }]
          });
        });
      } else if (selector === 'p, div, article, section') {
        mockElement.text = jest.fn(() => 'Test content paragraph.');
      }
      
      return mockElement;
    };
    
    $.html = jest.fn(() => html);
    $.text = jest.fn(() => 'Test text content');
    
    return $;
  }),
};

export = cheerio;