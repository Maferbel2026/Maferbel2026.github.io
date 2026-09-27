# FEMFORM: paso de Stripe Sandbox a Live

La integración Sandbox ya fue probada con un pago simulado. El código usa importes fijos y no contiene claves ni valores de ejemplo. El cambio a Live debe mantener `STRIPE_MODE=test` hasta completar la configuración de la cuenta, el webhook y los secretos Live.

## Valores a reemplazar

No hay placeholders en el código. `mode=payment`, URLs de retorno y cancelación, y los dos importes MXN ya están definidos en [stripe.js](worker/stripe.js). El Worker coteja `STRIPE_MODE` con la clave, `livemode` y el ID de sesión. Se llama a la API REST de Stripe sin fijar una versión de SDK. `payment_method_collection` se omite: Stripe lo permite solo para suscripciones y estos son pagos únicos.

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

## Configuración pendiente para Live

1. La propietaria completa **Activate Payments** en Stripe con sus datos de negocio, identidad y banco. Estos datos y cualquier aceptación de términos se ingresan solamente en Stripe.
2. Desplegar la nueva versión de [Code.gs](../integrations/consultas/Code.gs) en el Web App ya existente. La única ampliación es aceptar IDs `cs_live_` además de `cs_test_`; la hoja, firma y Calendly se conservan.
3. En Stripe **Live**, crear preferentemente una clave restringida `rk_live_...` con permiso de escritura para crear Checkout Sessions y lectura para recuperar sesiones. Crear un destino webhook **Live** hacia `https://femform-nutricion-online.ma-fer-13.chatgpt.site/api/stripe-webhook` que escuche `checkout.session.completed` y `checkout.session.async_payment_succeeded`. Guardar el secreto de firma Live. El destino de Sandbox es independiente.
4. En Sites, establecer `STRIPE_SECRET_KEY` con la clave Live y `STRIPE_WEBHOOK_SECRET` con el secreto del webhook Live; fijar `STRIPE_MODE=live` en el mismo corte. Mantener `SHEETS_ENDPOINT`, `SHEETS_SIGNING_SECRET`, `SITE_ORIGIN` y `EXTRA_ORIGIN`. No escribir claves en Git, recursos públicos ni el chat.
5. Comprobar que Live crea una sesión **impaga** por $800 MXN y otra por $600 MXN, y que ninguna muestra agenda antes de pagar. Un ID de Sandbox tampoco debe abrir agenda en Live. El pago exitoso de extremo a extremo requiere que la titular realice una transacción real; no usar tarjetas de prueba en Live.
6. Confirmar que el Site y GitHub Pages usan el Worker actualizado. Revisar los primeros eventos Live y filas de `Consultas`; si el webhook falla, detener nuevos cobros y corregir antes de reabrir Checkout.

El Worker contiene la lógica; Sheets es el registro durable. No se requiere D1/KV ni plan Cloudflare de pago. Si el runtime gratuito alcanza su cuota, las solicitudes fallan y no se abren agendas sin verificación.

Para las pruebas Sandbox se utilizó la tarjeta de prueba de [Stripe](https://docs.stripe.com/testing); esas tarjetas no funcionan para cobros reales.
