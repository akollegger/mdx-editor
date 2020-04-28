import React, {useState, lazy, Suspense} from 'react'

import ErrorBoundary from 'react-error-boundary';

import theme from './theme'
import { ThemeProvider } from 'theme-ui'

import { Flex, Box } from 'reflexbox'
import { Card, Text } from 'theme-ui'

import MDX from '@mdx-js/runtime'
import remark  from 'remark'
import remarkMDX from 'remark-mdx'

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-markdown";
import "ace-builds/src-noconflict/theme-github";

const toMDXAST = require('@mdx-js/mdx/md-ast-to-mdx-ast')
const fromXml = require('xast-util-from-xml')
const visit = require('unist-util-visit')
const sanitizeHast = require('hast-util-sanitize')

const sanitizingSchema = {
  "tagNames": [
    "Demo"
  ],
  "attributes": {
    "*": [
      "name"
    ]
  },
  "strip": []
  
}

const sanitizeMDX = (text:string):string => {
  const contents = remark()
    .use(remarkMDX)
    .use(toMDXAST)

    .use(() => (tree:any) => {
      console.log(tree)
    })

    .use(() => (tree:any) => {
        visit(tree, 'jsx', (node:any) => {
          try {
            const xmlTree = fromXml(node.value);
            const sanitized = sanitizeHast(xmlTree, sanitizingSchema);
            console.log("xmlTree", xmlTree);
            console.log("sanitized", sanitized); // todo: xml sanitizing. the hast sanitizer looks for 'tagName' rather than 'name' on elements.
            node.children = xmlTree.children
          } catch (e) {
            node.value = `<FixMe position={{start: {line: ${node.position.start.line}, column: ${node.position.start.column}, offset: ${node.position.start.offset}}, end: {line: ${node.position.end.line}, column: ${node.position.end.column}, offset: ${node.position.end.offset}}}} />`
          }
        })
    })
    .processSync(text).toString();
  return contents;
}

const components = {
  h1: (props:any) => <h1 style={{color: 'tomato'}} {...props} />,
  Demo: (props:any) => <h1>This is a demo component</h1>,
  FixMe: (props:any) => <pre>Fix me!</pre>
}

const scope = {
  some: 'value'
}
const placeholderMDX = `
# Hello, world!

<Demo />
`

// const Content = lazy(() => importMDX('./example.mdx'))

export default (props:any) => {
  const [content, setContent] = useState('')
  const [parsedContent, setParsedContent] = useState('');

return (
<ThemeProvider theme={theme}>

  <Flex flexDirection='column' height='100vh'>
    <Box
      flex='1'
      p={3}
      color='white'
      bg='primary'>
        <Card>
          <AceEditor
            placeholder='# MDX for Browser Guides'
            focus={true}
            defaultValue={placeholderMDX}
            width='100%'
            height='50%'
            mode="markdown"
            theme="github"
            name="cypher mdx"
            showGutter={false}
            showPrintMargin={false}
            fontSize={14}
            minLines={8}
            editorProps={{ $blockScrolling: true }}
            value={content}
            onChange={(newMDX:string) => {
                setParsedContent(sanitizeMDX(newMDX));
                setContent(newMDX);
              }
            }
          />
      </Card>

    </Box>


    <Box
      flex='1'
      p={3}
      color='white'
      bg='secondary'>
        <Card>
          <ErrorBoundary>
          <MDX components={components} scope={scope}>
            {parsedContent}
          </MDX>
          </ErrorBoundary>
        </Card>
    </Box>
  </Flex>

</ThemeProvider>
)};
