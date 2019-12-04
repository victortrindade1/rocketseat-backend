<!-- TOC -->

- [Configurando o template de e-mail (HTML com Node)](#configurando-o-template-de-e-mail-html-com-node)
  - [src/lib/Mail.js](#srclibmailjs)
  - [src/app/views/emails/layouts/default.hbs](#srcappviewsemailslayoutsdefaulthbs)
  - [src/app/views/emails/partials/footer.hbs](#srcappviewsemailspartialsfooterhbs)
  - [src/app/views/emails/cancellation.hbs](#srcappviewsemailscancellationhbs)
  - [src/app/controllers/AppointmentController.js](#srcappcontrollersappointmentcontrollerjs)

<!-- /TOC -->

# Configurando o template de e-mail (HTML com Node)

Aqui vc vai ver como criar views html no backend. No front é mole, tem o React,
mas as vezes precisamos disparar umas views simples pelo backend, como por
exemplo o envio de e-mails. Para usar HTML no Node, vamos usar a lib
`express-handlebars`, que permite HTML e variáveis JS juntos.

`yarn add express-handlebars`

Para criar views para o Nodemailer, vc tb precisará instalar a lib
`nodemailer-express-handlebars`

`yarn add nodemailer-express-handlebars`

No GoBarber, neste momento foram criados os diretórios e arquivos:

- src/app/views/emails/layouts/default.hbs
- src/app/views/emails/partials/footer.hbs
- src/app/views/emails/cancellation.hbs

## src/lib/Mail.js

```diff
import nodemailer from 'nodemailer';
+import { resolve } from 'path'; // Para o node saber as paths dos templates
+import exphbs from 'express-handlebars';
+import nodemailerhbs from 'nodemailer-express-handlebars';

import mailConfig from '../config/mail';

class Mail {
  constructor() {
    const { host, port, secure, auth } = mailConfig;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: auth.user ? auth : null,
    });

+    this.configureTemplates();
  }

+  configureTemplates() {
+    const viewPath = resolve(__dirname, '..', 'app', 'views', 'emails');
+
+    this.transporter.use(
+      'compile',
+      nodemailerhbs({
+        viewEngine: exphbs.create({
+          layoutsDir: resolve(viewPath, 'layouts'),
+          partialsDir: resolve(viewPath, 'partials'),
+          defaultLayout: 'default',
+          extname: '.hbs',
+        }),
+        viewPath,
+        extName: '.hbs',
+      })
+    );
+  }

  sendMail(message) {
    return this.transporter.sendMail({
      ...mailConfig.default,
      ...message,
    });
  }
}

export default new Mail();
```

## src/app/views/emails/layouts/default.hbs

```hbs
<div
  style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6; color: #222; max-width: 600px">
  {{{ body }}}
  {{> footer }}
</div>
```

## src/app/views/emails/partials/footer.hbs

```hbs
<br />
Equipe GoBarber
```

## src/app/views/emails/cancellation.hbs

```hbs
<strong>Olá, {{ provider }}</strong>
<p>Houve um cancelamento de horário. Confira os detalhes abaixo:</p>
<p>
  <strong>Cliente: </strong> {{ user }} <br />
  <strong>Data/hora: </strong> {{ date }} <br />
  <br />
  <small>
    O horário está novamente disponível para novos agendamentos.
  </small>
</p>
```

## src/app/controllers/AppointmentController.js

```diff
  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
+        {
+          model: User,
+          as: 'user',
+          attributes: ['name'],
+        },
      ],
    });

    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: "You don't have permission to cancel this appointment.",
      });
    }

    ...

    await Mail.sendMail({
      to: `${appointment.provider.name} <${appointment.provider.email}>`,
      subject: 'Agendamento cancelado',
-      text: 'Você tem um novo cancelamento', // Em vez de text poderia ser um html
+      template: 'cancellation',
+      context: {
+        provider: appointment.provider.name,
+        user: appointment.user.name,
+        date: format(appointment.date, "'dia' dd 'de' MMMM', às' H:mm'h'", {
+          locale: pt,
+        }),
+      },
    });
```
