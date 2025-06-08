
const authorizeRoles = (req, res, next) => {
      if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: 'Forbidden: Insufficient role' });
      }
      next();
    };
  
//in router 
app.get('/admin-only', identifier, authorizeRoles, (req, res) => {
    res.json({ success: true, message: 'Welcome admin!' });
});





  