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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu enlace de acceso a {siteName}</Preview>
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
        <Heading style={h1}>Tu enlace de acceso</Heading>
        <Text style={text}>
          Toca el botón para entrar a {siteName}. No necesitas contraseña.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Entrar a {siteName}
        </Button>
        <Text style={muted}>
          Si el botón no funciona, copia y pega este enlace:
          <br />
          <Link href={confirmationUrl} style={link}>
            {confirmationUrl}
          </Link>
        </Text>
        <Text style={footer}>
          Este enlace caduca pronto y solo se puede usar una vez. Si no lo
          pediste, ignora este mensaje.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
