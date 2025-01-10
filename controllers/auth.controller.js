class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async login(req, res) {
    try {
      const loginDto = {
        email: req.body.email,
        password: req.body.password
      };
      
      const result = await this.authService.login(loginDto);
      res.json(result);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }
}

module.exports = AuthController;