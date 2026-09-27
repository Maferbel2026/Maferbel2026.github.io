# FEMFORM: activación de pagos en Sandbox

El código usa importes reales del catálogo FEMFORM y no contiene valores de ejemplo. **No activar pagos en vivo ni publicar el nuevo flujo hasta completar y probar esta lista.**

## Valores a reemplazar

No hay placeholders en el código. `mode=payment`, URLs de retorno y cancelación, y los dos importes MXN ya están definidos en [stripe.js](worker/stripe.js). Se llama a la API REST de Stripe sin fijar una versión de SDK. `payment_method_collection` se omite: Stripe lo permite solo para suscripciones y estos son pagos únicos.

## Parámetros de Checkout configurados

| Parámetro | Valor |
| --- | --- |
| `ui_mode` | `hosted_page` |
| `mode` | `payment` |
| `billing_address_collection` | `auto` |
| `phone_number_collection.enabled` | `false` |
| `automatic_tax.enabled` | `false` |
| `allow_promotion_codes` | `false` |
| `submit_type` | `auto` |
| `name_collection.individual` | habilitado y opcional |
| `integration_identifier` | `hosted_web_0001` |
| `origin_context` | `web` |
| `line_items` | primera 800.00 MXN; seguimiento 600.00 MXN, fijados en servidor |
| `success_url` | URL del Site `/pago/?session_id={CHECKOUT_SESSION_ID}` |
| `cancel_url` | URL del Site `/#consultas` |

## Configuración pendiente

1. En Stripe **Sandbox/Test**, crear preferentemente una clave restringida `rk_test_...` con permiso para crear y consultar Checkout Sessions, o usar temporalmente una clave `sk_test_...` si la cuenta no permite restringirla; registrar el endpoint `https://femform-nutricion-online.ma-fer-13.chatgpt.site/api/stripe-webhook` para `checkout.session.completed` y `checkout.session.async_payment_succeeded`, y obtener su secreto `whsec_...`.
2. En Calendly, disponer de un token personal con permiso `shares:write` y de la URI API de **un único evento individual** compatible con las duraciones 60 y 45 minutos. Probar que `/shares` genera un enlace de un solo uso por consulta.
3. Desplegar [Code.gs](../integrations/consultas/Code.gs) como **nuevo** Apps Script Web App ejecutado como propietaria, accesible a cualquiera. Mantener privado el archivo de Sheets y ejecutar `setupConsultationTabs()` para crear solamente `Leads` y `Consultas`. En las propiedades del script establecer `FEMFORM_SIGNING_SECRET`, `CALENDLY_TOKEN` y `CALENDLY_EVENT_TYPE_URI`. No reutilizar el Web App público de la lista del libro.
4. En los secretos del runtime Sites configurar `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SHEETS_ENDPOINT` (URL `/exec`) y `SHEETS_SIGNING_SECRET` (el mismo secreto de firma del Apps Script). En variables no secretas configurar `SITE_ORIGIN=https://femform-nutricion-online.ma-fer-13.chatgpt.site` y `EXTRA_ORIGIN=https://maferbel2026.github.io` si se mantiene la copia de GitHub Pages. Nunca escribir claves en `dist`, Git o el chat.
5. Probar en Sandbox: envío de correo crea `Leads` antes del salto a Stripe; cancelación no crea `Consultas`; pago de prueba registra una sola fila con código, monto, fecha y enlace individual; recargar retorno y repetir webhook no duplica la fila; URL de éxito inventada o sesión impaga no abre Calendly. Comparar ambas duraciones y probar en móvil.
6. Antes del corte público, desactivar o sustituir los dos eventos/URLs antiguos de Calendly que aún permiten reservar sin pagar. Coordinar este paso con la propietaria para no perder reservas existentes. Revisar vista previa y publicar solo tras su aprobación.

No se requiere D1/KV ni plan Cloudflare de pago. El Worker contiene la lógica; Sheets es el registro durable. Si el runtime gratuito alcanza su cuota, las solicitudes fallan y no se abren agendas sin verificación.

Prueba de tarjeta en Stripe Sandbox: `4242 4242 4242 4242`, fecha futura, CVC cualquiera. Fuente: [documentación de pruebas de Stripe](https://docs.stripe.com/testing).
