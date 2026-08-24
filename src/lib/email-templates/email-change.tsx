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

import {
  brand,
  brandBar,
  brandLogo,
  brandName,
  button,
  container,
  footer,
  h1,
  link,
  main,
  muted,
  text,
} from './signup'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Confirma tu nuevo correo en {siteName}</Preview>
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
        <Heading style={h1}>Confirma tu nuevo correo</Heading>
        <Text style={text}>
          Pediste cambiar el correo de tu cuenta en {siteName} de{' '}
          <strong>{oldEmail || email}</strong> a{' '}
          <strong>{newEmail || email}</strong>.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar el cambio
        </Button>
        <Text style={muted}>
          Si el botón no funciona, copia y pega este enlace:
          <br />
          <Link href={confirmationUrl} style={link}>
            {confirmationUrl}
          </Link>
        </Text>
        <Text style={footer}>
          Si no pediste este cambio, ignora este mensaje y tu correo actual
          seguirá igual.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
