export const passwordResetEmail = (email, resetLink) => `
      <!doctype html>
      <html lang="en">
        <body style="margin:0;padding:0;background-color:#06101a;color:#ffffff;font-family:Arial,Helvetica,sans-serif">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#06101a">
            <tr>
              <td align="center" style="padding:48px 16px">
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  style="max-width:560px;background-color:#0a1520;border:1px solid #242d38;border-radius:12px;overflow:hidden"
                >
                  <tr>
                    <td style="padding:28px 36px;border-bottom:1px solid #242d38">
                      <span style="color:#00c853;font-size:28px;line-height:1">♠</span>
                      <span style="margin-left:8px;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-1px">
                        River<span style="color:#00c853">IQ</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px 36px">
                      <p style="margin:0 0 10px;color:#00c853;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">
                        Password reset
                      </p>
                      <h1 style="margin:0;color:#ffffff;font-size:30px;line-height:1.25;letter-spacing:-0.6px">
                        Choose a new password
                      </h1>
                      <p style="margin:18px 0 28px;color:#8f99a6;font-size:16px;line-height:1.7">
                        We received a request to reset your RiverIQ password. Use the secure button below to choose a new one.
                      </p>
                      <table role="presentation" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="border-radius:6px;background-color:#00c853">
                            <a
                              href="${resetLink}"
                              style="display:inline-block;padding:14px 26px;color:#04180b;font-size:15px;font-weight:700;text-decoration:none"
                            >
                              Reset my password
                            </a>
                          </td>
                        </tr>
                      </table>
                      <div style="margin-top:30px;padding:18px;background-color:#07111b;border:1px solid #242d38;border-radius:8px">
                        <p style="margin:0;color:#a6b0bb;font-size:13px;line-height:1.6">
                          This link expires in <strong style="color:#ffffff">5 minutes</strong>. If you did not request a password reset,
                          you can safely ignore this email.
                        </p>
                      </div>
                      <p style="margin:28px 0 8px;color:#697584;font-size:12px;line-height:1.5">
                        If the button does not work, copy and paste this URL into your browser:
                      </p>
                      <p style="margin:0;word-break:break-all;color:#00c853;font-size:12px;line-height:1.5">
                        ${resetLink}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 36px;background-color:#07111b;border-top:1px solid #242d38;color:#697584;font-size:12px">
                      © ${new Date().getFullYear()} RiverIQ. Secure poker performance tracking.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

export const verifyEmail = (email, verifyLink) => `<!doctype html>
  <html lang="en">
    <body style="margin:0;padding:0;background-color:#06101a;color:#ffffff;font-family:Arial,Helvetica,sans-serif">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#06101a">
        <tr>
          <td align="center" style="padding:48px 16px">
            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              style="max-width:560px;background-color:#0a1520;border:1px solid #242d38;border-radius:12px;overflow:hidden"
            >
              <tr>
                <td style="padding:28px 36px;border-bottom:1px solid #242d38">
                  <span style="color:#00c853;font-size:28px;line-height:1">♠</span>
                  <span style="margin-left:8px;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-1px">
                    River<span style="color:#00c853">IQ</span>
                  </span>
                </td>
              </tr>

              <tr>
                <td style="padding:40px 36px">
                  <p style="margin:0 0 10px;color:#00c853;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">
                    Account verification
                  </p>

                  <h1 style="margin:0;color:#ffffff;font-size:30px;line-height:1.25;letter-spacing:-0.6px">
                    Verify your email address
                  </h1>

                  <p style="margin:18px 0 28px;color:#8f99a6;font-size:16px;line-height:1.7">
                    Welcome to RiverIQ! Verify your email address to activate your
                    account and start tracking your poker performance.
                  </p>

                  <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="border-radius:6px;background-color:#00c853">
                        <a
                          href="${verifyLink}"
                          style="display:inline-block;padding:14px 26px;color:#04180b;font-size:15px;font-weight:700;text-decoration:none"
                        >
                          Verify my email
                        </a>
                      </td>
                    </tr>
                  </table>

                  <div style="margin-top:30px;padding:18px;background-color:#07111b;border:1px solid #242d38;border-radius:8px">
                    <p style="margin:0;color:#a6b0bb;font-size:13px;line-height:1.6">
                      If you did not create a RiverIQ account, you can safely
                      ignore this email.
                    </p>
                  </div>

                  <p style="margin:28px 0 8px;color:#697584;font-size:12px;line-height:1.5">
                    If the button does not work, copy and paste this URL into your browser:
                  </p>

                  <p style="margin:0;word-break:break-all;color:#00c853;font-size:12px;line-height:1.5">
                    ${verifyLink}
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:20px 36px;background-color:#07111b;border-top:1px solid #242d38;color:#697584;font-size:12px">
                  © ${new Date().getFullYear()} RiverIQ. Secure poker performance tracking.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
