import React, { useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";

import { auth } from "../../services/firebase";

const Register = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setLoading(true);
    try {
      // Tell firebase to send confirmation link to user's email
      await auth.sendSignInLinkToEmail(email, {
        url: process.env.REACT_APP_CONFIMATION_EMAIL_REDIRECT,
        handleCodeInApp: true,
      });

      // Store user's email into localstorage
      localStorage.setItem("REGISTER_EMAIL", email);

      // Display a success toast
      toast.success(
        `Link successfully sent to ${email}, click the link to complete your registration.`
      );

      setEmail("");
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <Grid container justify="center">
      <Grid item xs={11} sm={8} md={6}>
        <Card style={{ padding: "1rem" }} elevation={3}>
          <CardContent>
            <Typography variant="h6" align="center" gutterBottom>
              Register Account
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                id="register-email"
                label="Enter your email address"
                fullWidth
                value={email}
                onChange={(evt) => setEmail(evt.target.value)}
                style={{ marginBottom: "1rem" }}
                inputProps={{ type: "email" }}
              />
              <Button
                color="primary"
                variant="contained"
                disabled={!email || !!loading}
                fullWidth
                type="submit"
              >
                {loading ? (
                  <CircularProgress
                    style={{ height: "1.5rem", width: "1.5rem" }}
                  />
                ) : (
                  "Register"
                )}
              </Button>
            </Box>
            <Typography
              variant="caption"
              style={{ display: "block", marginTop: "0.5rem" }}
            >
              Has an account? <Link to="/login">Sign in.</Link>
            </Typography>
            <Typography variant="caption" color="textPrimary">
              Forgot password?{" "}
              <Link to="/password-forget">Reset password.</Link>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Register;
