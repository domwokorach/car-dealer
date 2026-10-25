import { View } from 'react-native';
import { Accordion } from '@/components/panel/accordion';
import { Breadcrumb } from '@/components/panel/breadcrumb';
import { Card } from '@/components/panel/card';
import { Carousel } from '@/components/panel/carousel';
import { Direction } from '@/components/panel/direction';
import { FlipCard } from '@/components/panel/flip-card';
import { PageHeader } from '@/components/panel/page-header';
import { Skeleton } from '@/components/panel/skeleton';
import { Typography } from '@/components/panel/typography';
import { Text } from '@/components/ui';
import { Demo } from '../demo';

export function LayoutTypography() {
  return (
    <>
      <Demo title="Typography">
        <Typography type="h2">Heading</Typography>
        <Typography>Body copy follows the theme tokens.</Typography>
        <Typography underline>Underlined link text</Typography>
      </Demo>
      <Demo title="Card">
        <Card>
          <Card.Header>
            <Card.Title>Card title</Card.Title>
            <Card.Description>Supporting description</Card.Description>
          </Card.Header>
        </Card>
      </Demo>
      <Demo title="PageHeader">
        <PageHeader>
          <PageHeader.Cover />
          <PageHeader.Avatar fallback="CD" />
          <PageHeader.Content>
            <PageHeader.Title>Car Dealer</PageHeader.Title>
            <PageHeader.Description>Premium pre-owned and new</PageHeader.Description>
          </PageHeader.Content>
        </PageHeader>
      </Demo>
      <Demo title="Carousel">
        <Carousel>
          <Carousel.Content style={{ height: 120 }}>
            {['One', 'Two', 'Three'].map((t) => (
              <Carousel.Item key={t}>
                <View className="flex-1 items-center justify-center rounded-xl bg-secondary">
                  <Text variant="heading">{t}</Text>
                </View>
              </Carousel.Item>
            ))}
          </Carousel.Content>
          <Carousel.Controls />
        </Carousel>
      </Demo>
      <Demo title="Accordion">
        <Accordion selectionMode="single" defaultValue="a">
          {[['a', 'First section'], ['b', 'Second section']].map(([value, title]) => (
            <Accordion.Item key={value} value={value!}>
              <Accordion.Trigger>
                <Accordion.Title>{title}</Accordion.Title>
                <Accordion.Indicator />
              </Accordion.Trigger>
              <Accordion.Content>
                <Text tone="muted">Expands and collapses on the UI thread.</Text>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion>
      </Demo>
      <Demo title="Breadcrumb">
        <Breadcrumb>
          <Breadcrumb.List>
            <Breadcrumb.Item><Breadcrumb.Link>Showroom</Breadcrumb.Link></Breadcrumb.Item>
            <Breadcrumb.Item><Breadcrumb.Link>SUVs</Breadcrumb.Link></Breadcrumb.Item>
            <Breadcrumb.Item><Breadcrumb.Page>Details</Breadcrumb.Page></Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb>
      </Demo>
      <Demo title="FlipCard" note="Tap to turn over.">
        <FlipCard>
          <FlipCard.Front className="items-center justify-center rounded-2xl bg-card p-6"><Text>Front</Text></FlipCard.Front>
          <FlipCard.Back className="items-center justify-center rounded-2xl bg-primary p-6"><Text className="text-primary-foreground">Back</Text></FlipCard.Back>
        </FlipCard>
      </Demo>
      <Demo title="Skeleton">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
      </Demo>
      <Demo title="Direction" note="Right-to-left reading order.">
        <Direction dir="rtl"><Text>مرحبا بكم في المعرض</Text></Direction>
      </Demo>
    </>
  );
}
