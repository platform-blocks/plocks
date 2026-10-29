import { useRef } from 'react';
import type { ScrollView } from 'react-native';
import { Block, Row, ScrollArea, TableOfContents, Text, Title, TitleRegistryProvider } from '@plocks/ui';

const SECTIONS = [
  { id: 'overview', title: 'Overview', copy: 'Introduce the feature and set expectations for the rest of the document.' },
  { id: 'install', title: 'Installation', copy: 'List required packages and platform caveats so teams can get started quickly.' },
  { id: 'usage', title: 'Usage', copy: 'Highlight the most common ways to use the feature with short inline examples.' },
  { id: 'theming', title: 'Theming', copy: 'Show which tokens the feature reads and how to override them per screen.' },
  { id: 'troubleshooting', title: 'Troubleshooting', copy: 'Capture the top issues support sees and the steps that usually resolve them.' },
];

export function Demo() {
  const hostRef = useRef<ScrollView>(null);

  return (
    <TitleRegistryProvider>
      <Row gap="xl" align="flex-start">
        <TableOfContents
          container="#scroll-spy-host-content"
          scrollSpyOptions={{ scrollHost: hostRef }}
          variant="outline"
          size="sm"
          p="sm"
          style={{ width: 200 }}
        />
        <ScrollArea ref={hostRef} id="scroll-spy-host-content" h={240} grow={1} contentProps={{ gap: 'xl' }}>
          {SECTIONS.map(section => (
            <Block key={section.id} gap="xs">
              <Title order={2}>{section.title}</Title>
              <Text c="secondary">{section.copy}</Text>
              <Text c="secondary">{section.copy}</Text>
            </Block>
          ))}
        </ScrollArea>
      </Row>
    </TitleRegistryProvider>
  );
}
