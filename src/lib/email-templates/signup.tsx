import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Img,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Confirma tu correo y empieza tu camino en {siteName}</Preview>
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
        <Heading style={h1}>Confirma tu correo</Heading>
        <Text style={text}>
          Gracias por crear tu cuenta en{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Un paso más y tu camino empieza.
        </Text>
        <Text style={text}>
          Confirma tu correo (<strong>{recipient}</strong>) con el botón de
          abajo:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar mi correo
        </Button>
        <Text style={muted}>
          Si el botón no funciona, copia y pega este enlace en tu navegador:
          <br />
          <Link href={confirmationUrl} style={link}>
            {confirmationUrl}
          </Link>
        </Text>
        <Text style={footer}>
          Si no creaste esta cuenta, puedes ignorar este mensaje.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

export const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  color: '#1B1930',
}
export const container = {
  padding: '24px',
  maxWidth: '560px',
  margin: '0 auto',
}
export const brandBar = { paddingBottom: '16px', textAlign: 'center' as const }
export const brandLogo = { borderRadius: '12px', margin: '0 auto 8px', display: 'block' as const }
export const brandName = {
  fontSize: '13px',
  fontWeight: 700 as const,
  letterSpacing: '1px',
  color: '#7C5CFF',
  margin: '0',
  textAlign: 'center' as const,
}
export const brand = {
  fontSize: '15px',
  fontWeight: 700 as const,
  letterSpacing: '2px',
  color: '#7C5CFF',
  margin: '0',
  textTransform: 'uppercase' as const,
}
export const h1 = {
  fontSize: '26px',
  lineHeight: '1.2',
  fontWeight: 700 as const,
  color: '#1B1930',
  margin: '0 0 16px',
}
export const text = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#1B1930',
  margin: '0 0 16px',
}
export const muted = {
  fontSize: '13px',
  lineHeight: '1.5',
  color: '#6B6A85',
  margin: '24px 0 0',
  wordBreak: 'break-all' as const,
}
export const link = { color: '#7C5CFF', textDecoration: 'underline' }
export const button = {
  backgroundColor: '#7C5CFF',
  color: '#FFFFFF',
  fontSize: '16px',
  fontWeight: 600 as const,
  borderRadius: '12px',
  padding: '16px 28px',
  textDecoration: 'none',
  display: 'inline-block',
  textAlign: 'center' as const,
}
export const footer = {
  fontSize: '13px',
  lineHeight: '1.5',
  color: '#6B6A85',
  margin: '24px 0 0',
  borderTop: '1px solid #EDEAF7',
  paddingTop: '16px',
}
