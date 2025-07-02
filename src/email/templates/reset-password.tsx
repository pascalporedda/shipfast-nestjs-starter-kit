import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface ResetPasswordEmailProps {
  name: string;
  resetLink: string;
  expiresIn?: string;
}

export const ResetPasswordEmail = ({
  name = 'User',
  resetLink,
  expiresIn = '1 hour',
}: ResetPasswordEmailProps) => {
  const previewText = `Reset your password`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reset Your Password</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            We received a request to reset your password. Click the button below
            to create a new password.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetLink}>
              Reset Password
            </Button>
          </Section>
          <Text style={text}>
            This link will expire in {expiresIn}. If you didn't request a
            password reset, you can safely ignore this email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            For security reasons, this link can only be used once. If you need
            to reset your password again, please request a new link.
          </Text>
          <Text style={footer}>
            If you're having trouble clicking the button, copy and paste this
            URL into your browser:
          </Text>
          <Link href={resetLink} style={link}>
            {resetLink}
          </Link>
        </Container>
      </Body>
    </Html>
  );
};

export default ResetPasswordEmail;

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
  backgroundColor: '#dc2626',
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

const link = {
  color: '#5e6ad2',
  fontSize: '14px',
  padding: '0 48px',
  wordBreak: 'break-all' as const,
};
