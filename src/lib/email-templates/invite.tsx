import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

import {
  brand,
  brandBar,
  button,
  container,
  footer,
  h1,
  link,
  main,
  muted,
  text,
} from './signup'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Te invitaron a {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brand}>{siteName}</Text>
        </Section>
        <Heading style={h1}>Te invitaron a {siteName}</Heading>
        <Text style={text}>
          Alguien te abrió la puerta a{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Acepta la invitación y crea tu acceso.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Aceptar la invitación
        </Button>
        <Text style={muted}>
          Si el botón no funciona, copia y pega este enlace:
          <br />
          <Link href={confirmationUrl} style={link}>
            {confirmationUrl}
          </Link>
        </Text>
        <Text style={footer}>
          Si no esperabas esta invitación, puedes ignorar este mensaje.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
