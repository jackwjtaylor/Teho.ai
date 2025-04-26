import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface ReminderEmailProps {
  todoTitle: string;
  dueDate: string;
  userName: string;
}

export const ReminderEmail: React.FC<ReminderEmailProps> = ({
  todoTitle,
  dueDate,
  userName,
}) => {
  return (
    <Html>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={heading}>Todo Reminder</Text>
            <Text style={paragraph}>Hi {userName},</Text>
            <Text style={paragraph}>
              This is a reminder that your todo "{todoTitle}" is due {dueDate}.
            </Text>
            <Hr style={hr} />
            <Button
              href="https://agenda.dev/todos"
              style={button}
            >
              View Todo
            </Button>
            <Hr style={hr} />
            <Text style={footer}>
              Sent by Agenda - Your Supercharged Todo List
            </Text>
            <Text>
              Try Agenda for free:
            </Text>
            <Button
              href="https://agenda.dev"
              style={button}
            >
              Get Agenda
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const heading = {
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '16px 0',
  color: '#484848',
  fontFamily: '"Outfit", sans-serif',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.4',
  color: '#484848',
  margin: '16px 0',
  fontFamily: '"Outfit", sans-serif',
};

const button = {
  backgroundColor: '#5046e4',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px',
  margin: '24px 0',
  fontFamily: '"Outfit", sans-serif',
  fontWeight: '500',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#9BA2B0',
  fontSize: '14px',
  margin: '0',
  fontFamily: '"Outfit", sans-serif',
}; 