import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface NotificationEmailProps {
  name: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export const NotificationEmail = ({
  name = 'User',
  title,
  message,
  actionUrl,
  actionText = 'View Details',
  type = 'info',
}: NotificationEmailProps) => {
  const previewText = title;

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{title}</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>{message}</Text>
          {actionUrl && (
            <Section style={buttonContainer}>
              <Button
                style={{ ...button, backgroundColor: getButtonColor() }}
                href={actionUrl}
              >
                {actionText}
              </Button>
            </Section>
          )}
          <Hr style={hr} />
          <Text style={footer}>
            This is an automated notification. Please do not reply to this
            email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default NotificationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '0 48px',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 48px',
};

const buttonContainer = {
  padding: '27px 0 27px 48px',
};

const button = {
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  padding: '0 48px',
};
