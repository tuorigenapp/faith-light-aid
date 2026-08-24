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
          <Img
            src="https://faith-light-aid.lovable.app/assets/logo-origen-55bEiby6.png"
            alt="ORÍGEN"
            width="56"
            height="56"
            style={brandLogo}
          />
          <Text style={brandName}>ORÍGEN — tuorigen.app</Text>
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
