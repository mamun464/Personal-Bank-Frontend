// project-imports
import AuthPasswordResetForm from 'sections/auth/AuthPasswordReset';

// ===========================|| AUTH - PASSWORD RESET PAGE ||=========================== //

export default function PasswordResetPage() {
  return (
    <div className="auth-main">
      <div className="auth-wrapper v1">
        <div className="auth-form">
          <div className="position-relative">
            <div className="auth-bg">
              <span className="r"></span>
              <span className="r s"></span>
              <span className="r s"></span>
              <span className="r"></span>
            </div>
            <AuthPasswordResetForm link="/login" />
          </div>
        </div>
      </div>
    </div>
  );
}
