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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Restablece tu contraseña de {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brand}>{siteName}</Text>
        </Section>
        <Heading style={h1}>Restablece tu contraseña</Heading>
        <Text style={text}>
          Recibimos una solicitud para cambiar la contraseña de tu cuenta en{' '}
          {siteName}. Crea una nueva con el botón de abajo.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Crear nueva contraseña
        </Button>
        <Text style={muted}>
          Si el botón no funciona, copia y pega este enlace:
          <br />
          <Link href={confirmationUrl} style={link}>
            {confirmationUrl}
          </Link>
        </Text>
        <Text style={footer}>
          Si no pediste este cambio, ignora este mensaje: tu contraseña actual
          sigue funcionando.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
