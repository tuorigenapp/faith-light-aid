import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Img,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

import { brand, brandBar, container, footer, h1, main, text } from './signup'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({
  token,
}: ReauthenticationEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu código de verificación</Preview>
    <Body style={main}>
      <Container style={container}>
                <Section style={brandBar}>
          <Img
            src="https://faith-light-aid.lovable.app/assets/logo-origen-55bEiby6.png"
            alt="ORÍGEN"
            width="56"
            height="56"
            style={brandLogo}
          />
          <Text style={brandName}>ORÍGEN — tuorigen.app</Text>
        </Section>
        <Heading style={h1}>Tu código de verificación</Heading>
        <Text style={text}>
          Usa este código para confirmar que eres tú:
        </Text>
        <Text style={code}>{token}</Text>
        <Text style={footer}>
          El código caduca en pocos minutos. Si no lo pediste, ignora este
          mensaje.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const code = {
  fontSize: '32px',
  fontWeight: 700 as const,
  letterSpacing: '8px',
  color: '#7C5CFF',
  backgroundColor: '#F4F1FF',
  borderRadius: '12px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '0 0 16px',
}
